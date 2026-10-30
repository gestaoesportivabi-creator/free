import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import Stripe from 'stripe';
import type { Subscription } from '@prisma/client';
import {
  billingReadiness,
  getProPriceId,
} from './stripeConfig';
import { buildProCheckoutParams } from './stripeCheckout';
import {
  commandFromStripeEvent,
  guardBillingWrite,
  mapStripeSubscriptionStatus,
  unresolvedRiskLookup,
} from './proSync';
import { isLifetimeProAccount, resolveEffectiveAccess } from '../../utils/subscription.helper';
import { getStripeClient } from './stripeClient';

function withEnv(vars: Record<string, string | undefined>, run: () => void) {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(vars)) {
    previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function subscription(partial: Partial<Subscription>): Subscription {
  return {
    id: 'sub-local',
    userId: 'user-1',
    plan: 'PRO',
    status: 'active',
    trialStartedAt: null,
    trialEndsAt: null,
    currentPeriodEnd: null,
    canceledAt: null,
    provider: 'stripe',
    providerCustomerId: 'cus_123',
    providerSubscriptionId: 'sub_123',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...partial,
  };
}

describe('Stripe PRO desligado sem chaves', () => {
  it('não liga o checkout e não instancia cliente', () => {
    withEnv(
      {
        STRIPE_SECRET_KEY: undefined,
        STRIPE_WEBHOOK_SECRET: undefined,
        STRIPE_PRICE_PRO_MONTHLY: undefined,
        STRIPE_PRICE_PRO: undefined,
        STRIPE_PRICE_PRO_YEARLY: undefined,
        STRIPE_PUBLISHABLE_KEY: undefined,
      },
      () => {
        const readiness = billingReadiness();
        assert.equal(readiness.enabled, false);
        assert.equal(readiness.publishableKey, null);
        assert.equal(getStripeClient(), null);
      }
    );
  });

  it('liga só com secret, webhook e pelo menos um preço', () => {
    withEnv(
      {
        STRIPE_SECRET_KEY: 'billing-disabled-placeholder',
        STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
        STRIPE_PRICE_PRO_MONTHLY: 'price_monthly',
        STRIPE_PRICE_PRO_YEARLY: 'price_yearly',
        STRIPE_PUBLISHABLE_KEY: 'pk_public_placeholder',
      },
      () => {
        const readiness = billingReadiness();
        assert.equal(readiness.enabled, true);
        assert.equal(readiness.monthly, true);
        assert.equal(readiness.yearly, true);
        assert.equal(getProPriceId('month'), 'price_monthly');
        assert.equal(readiness.publishableKey, 'pk_public_placeholder');
      }
    );
  });
});

describe('checkout do PRO', () => {
  it('não fixa payment_method_types e marca o fluxo', () => {
    const params = buildProCheckoutParams({
      customerId: 'cus_123',
      priceId: 'price_monthly',
      userId: 'user-1',
      interval: 'month',
      successUrl: 'https://example.com/planos/conta?checkout=success',
      cancelUrl: 'https://example.com/planos?checkout=cancel',
    });
    assert.equal(params.mode, 'subscription');
    assert.equal('payment_method_types' in params, false);
    assert.equal(params.client_reference_id, 'user-1');
    assert.match(params.integration_identifier || '', /^scout21_pro_[a-z]{8}$/);
    assert.equal(params.metadata?.plan, 'PRO');
  });
});

describe('webhook', () => {
  const stripe = new Stripe('billing-disabled-placeholder');
  const secret = 'whsec_test_secret';

  function signed(payload: string) {
    return stripe.webhooks.generateTestHeaderString({ payload, secret });
  }

  it('aceita assinatura válida e rejeita assinatura trocada', () => {
    const payload = JSON.stringify({
      id: 'evt_test',
      object: 'event',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test' } },
    });
    const event = stripe.webhooks.constructEvent(payload, signed(payload), secret);
    assert.equal(event.type, 'checkout.session.completed');
    assert.throws(() => stripe.webhooks.constructEvent(payload, signed(payload), 'whsec_other'));
  });

  it('não ativa o PRO enquanto o pagamento está pendente', () => {
    const command = commandFromStripeEvent({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          mode: 'subscription',
          payment_status: 'unpaid',
          client_reference_id: 'user-1',
          customer: 'cus_123',
          subscription: 'sub_123',
        },
      },
    } as Stripe.Event);
    assert.equal(command.action, 'ignore');
    assert.equal(command.reason, 'payment_pending');
  });

  it('ativa no checkout pago e no pagamento assíncrono', () => {
    const paid = commandFromStripeEvent({
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'subscription',
          payment_status: 'paid',
          client_reference_id: 'user-1',
          customer: 'cus_123',
          subscription: 'sub_123',
          metadata: { userId: 'user-1', plan: 'PRO' },
        },
      },
    } as Stripe.Event);
    assert.equal(paid.action, 'activate');
    assert.equal(paid.userId, 'user-1');
    assert.equal(paid.subscriptionId, 'sub_123');

    const asyncPaid = commandFromStripeEvent({
      type: 'checkout.session.async_payment_succeeded',
      data: {
        object: {
          mode: 'subscription',
          payment_status: 'paid',
          metadata: { userId: 'user-9' },
          customer: { id: 'cus_9' },
          subscription: { id: 'sub_9' },
        },
      },
    } as Stripe.Event);
    assert.equal(asyncPaid.action, 'activate');
    assert.equal(asyncPaid.userId, 'user-9');
    assert.equal(asyncPaid.customerId, 'cus_9');
  });

  it('sincroniza o ciclo da assinatura e desativa no cancelamento', () => {
    assert.equal(mapStripeSubscriptionStatus('active'), 'activate');
    assert.equal(mapStripeSubscriptionStatus('past_due'), 'past_due');
    assert.equal(mapStripeSubscriptionStatus('canceled'), 'cancel');
    assert.equal(mapStripeSubscriptionStatus('incomplete'), 'ignore');

    const updated = commandFromStripeEvent({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_123',
          object: 'subscription',
          status: 'past_due',
          customer: 'cus_123',
          metadata: { userId: 'user-1' },
          items: { data: [{ current_period_end: 1_800_000_000 }] },
        },
      },
    } as Stripe.Event);
    assert.equal(updated.action, 'past_due');
    assert.equal(updated.periodEndUnix, 1_800_000_000);

    const deleted = commandFromStripeEvent({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_123',
          status: 'canceled',
          customer: 'cus_123',
          metadata: { userId: 'user-1' },
        },
      },
    } as Stripe.Event);
    assert.equal(deleted.action, 'cancel');
  });

  it('trata fatura, disputa, reembolso e fraude sem soltar o teste', () => {
    const failed = commandFromStripeEvent({
      type: 'invoice.payment_failed',
      data: {
        object: {
          customer: 'cus_123',
          parent: { subscription_details: { subscription: 'sub_123', metadata: { userId: 'user-1' } } },
        },
      },
    } as Stripe.Event);
    assert.equal(failed.action, 'past_due');
    assert.equal(failed.subscriptionId, 'sub_123');
    assert.equal(guardBillingWrite(null, failed.action), false);
    assert.equal(guardBillingWrite({ provider: 'stripe', plan: 'PRO', status: 'active' }, 'past_due'), true);
    assert.equal(guardBillingWrite({ provider: null, plan: 'PERFORMANCE', status: 'trialing' }, 'cancel'), false);

    const dispute = commandFromStripeEvent({
      type: 'charge.dispute.created',
      data: { object: { payment_intent: { id: 'pi_1', customer: 'cus_123' } } },
    } as Stripe.Event);
    assert.equal(dispute.action, 'past_due');
    assert.equal(dispute.customerId, 'cus_123');

    const unresolved = commandFromStripeEvent({
      type: 'charge.dispute.created',
      data: { object: { payment_intent: 'pi_1' } },
    } as Stripe.Event);
    assert.equal(unresolved.customerId, null);
    assert.deepEqual(unresolvedRiskLookup({
      type: 'charge.dispute.created',
      data: { object: { payment_intent: 'pi_1' } },
    } as Stripe.Event), { paymentIntentId: 'pi_1' });

    const refund = commandFromStripeEvent({
      type: 'charge.refunded',
      data: { object: { customer: 'cus_123', amount: 1000, amount_refunded: 1000, refunded: true } },
    } as Stripe.Event);
    assert.equal(refund.action, 'cancel');

    const fraud = commandFromStripeEvent({
      type: 'radar.early_fraud_warning.created',
      data: { object: { charge: 'ch_1' } },
    } as Stripe.Event);
    assert.equal(fraud.action, 'past_due');
    assert.deepEqual(unresolvedRiskLookup({
      type: 'radar.early_fraud_warning.created',
      data: { object: { charge: 'ch_1' } },
    } as Stripe.Event), { chargeId: 'ch_1' });
  });
});

describe('PRO permanente', () => {
  it('admin, lista e provider lifetime não perdem o PRO', () => {
    assert.equal(
      isLifetimeProAccount({ roleName: 'ADMINISTRADOR', email: 'admin@admin.com' }, subscription({ status: 'canceled' })),
      true
    );

    const admin = resolveEffectiveAccess(
      { roleName: 'ADMINISTRADOR', email: 'admin@admin.com' },
      subscription({ status: 'canceled', plan: 'ESSENCIAL', provider: 'stripe' })
    );
    assert.equal(admin.isExpired, false);
    assert.equal(admin.isLifetimePro, true);
    assert.equal(admin.isPro, true);
    assert.equal(admin.plan, 'ADMINISTRADOR');
    assert.equal(admin.billingProvider, 'lifetime');

    withEnv({ LIFETIME_PRO_EMAILS: 'coach@example.com, outro@example.com' }, () => {
      const listed = resolveEffectiveAccess(
        { roleName: 'ESSENCIAL', email: 'Coach@example.com' },
        subscription({ status: 'canceled', plan: 'ESSENCIAL', provider: 'stripe' })
      );
      assert.equal(listed.isLifetimePro, true);
      assert.equal(listed.plan, 'PRO');
      assert.equal(listed.isExpired, false);
    });

    const marked = resolveEffectiveAccess(
      { roleName: 'ESSENCIAL', email: 'pessoa@example.com' },
      subscription({ status: 'canceled', provider: 'lifetime', plan: 'ESSENCIAL' })
    );
    assert.equal(marked.isLifetimePro, true);
    assert.equal(marked.isPro, true);
    assert.equal(marked.plan, 'PRO');
  });

  it('assinatura Stripe cancelada tira o PRO de quem não é permanente', () => {
    const canceled = resolveEffectiveAccess(
      { roleName: 'ESSENCIAL', email: 'pessoa@example.com' },
      subscription({ status: 'canceled', plan: 'PRO', provider: 'stripe' })
    );
    assert.equal(canceled.isExpired, true);
    assert.equal(canceled.isPro, false);
    assert.equal(canceled.plan, 'ESSENCIAL');

    const active = resolveEffectiveAccess(
      { roleName: 'ESSENCIAL', email: 'pessoa@example.com' },
      subscription({ status: 'active', plan: 'PRO', provider: 'stripe' })
    );
    assert.equal(active.isPro, true);
    assert.equal(active.plan, 'PRO');
    assert.equal(active.isExpired, false);

    const pastDue = resolveEffectiveAccess(
      { roleName: 'ESSENCIAL', email: 'pessoa@example.com' },
      subscription({ status: 'past_due', plan: 'PRO', provider: 'stripe' })
    );
    assert.equal(pastDue.isPro, true);
    assert.equal(pastDue.isExpired, false);
  });
});
