import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';
import type { Subscription } from '@prisma/client';
import { createStripeWebhookHandler } from '../src/routes/stripe.routes';
import {
  BillingDb,
  BillingError,
  createCheckoutSession,
  createPortalSession,
} from '../src/services/billing.service';
import { signStripePayload } from '../src/services/stripe/signature';
import { isCheckoutEnabled, isPortalEnabled, isWebhookEnabled } from '../src/config/stripe';
import { isEmailVerificationOverdue, resolveEffectiveAccess } from '../src/utils/subscription.helper';

const SECRET = 'whsec_test_not_a_real_secret';
const ENV_KEYS = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_ID_PRO', 'ADMIN_PRO_EMAILS'];
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

function makeSub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-1',
    userId: 'user-1',
    plan: 'PERFORMANCE',
    status: 'trialing',
    trialStartedAt: new Date('2026-01-01T00:00:00Z'),
    trialEndsAt: new Date('2026-01-31T00:00:00Z'),
    currentPeriodEnd: null,
    canceledAt: null,
    provider: null,
    providerCustomerId: null,
    providerSubscriptionId: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  } as Subscription;
}

/** Banco em memória com a fatia do Prisma que o billing usa. */
function fakeDb(initial: Subscription[] = [], users: string[] = ['user-1']) {
  const rows = [...initial];
  const matches = (row: Subscription, where: Record<string, unknown>) =>
    Object.entries(where).every(([key, value]) => (row as any)[key] === value);

  const db = {
    user: { findUnique: async ({ where }: any) => (users.includes(where.id) ? { id: where.id } : null) },
    subscription: {
      findFirst: async ({ where }: any) => rows.find((r) => matches(r, where)) ?? null,
      findUnique: async ({ where }: any) => rows.find((r) => matches(r, where)) ?? null,
      update: async ({ where, data }: any) => {
        const row = rows.find((r) => matches(r, where))!;
        Object.assign(row, data);
        return row;
      },
      upsert: async ({ where, update, create }: any) => {
        const row = rows.find((r) => matches(r, where));
        if (row) return Object.assign(row, update);
        const created = makeSub({ id: `sub-${rows.length + 1}`, ...create });
        rows.push(created);
        return created;
      },
    },
  };
  return { db: db as unknown as BillingDb, rows };
}

function fakeRes() {
  const res: any = { statusCode: 200, body: undefined };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body: unknown) => {
    res.body = body;
    return res;
  };
  return res;
}

async function postWebhook(db: BillingDb, event: unknown, opts: { signature?: string; body?: unknown } = {}) {
  const payload = JSON.stringify(event);
  const now = Math.floor(Date.now() / 1000);
  const req: any = {
    body: opts.body ?? Buffer.from(payload),
    headers: { 'stripe-signature': opts.signature ?? signStripePayload(payload, SECRET, now) },
  };
  const res = fakeRes();
  await createStripeWebhookHandler(db)(req, res);
  return res;
}

describe('webhook do Stripe', () => {
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  });

  test('assinatura inválida é recusada e não altera nada', async () => {
    const { db, rows } = fakeDb([makeSub()]);
    const event = {
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: { object: { mode: 'subscription', client_reference_id: 'user-1', customer: 'cus_1', subscription: 'sub_1' } },
    };
    const res = await postWebhook(db, event, { signature: signStripePayload(JSON.stringify(event), 'outro-segredo', Math.floor(Date.now() / 1000)) });

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'invalid_signature');
    assert.equal(rows[0].status, 'trialing');
  });

  test('assinatura antiga (replay) é recusada', async () => {
    const { db } = fakeDb([makeSub()]);
    const event = { id: 'evt_old', type: 'invoice.payment_failed', data: { object: {} } };
    const old = signStripePayload(JSON.stringify(event), SECRET, Math.floor(Date.now() / 1000) - 3600);
    const res = await postWebhook(db, event, { signature: old });
    assert.equal(res.statusCode, 400);
  });

  test('corpo já parseado (sem raw body) é recusado', async () => {
    const { db } = fakeDb([makeSub()]);
    const res = await postWebhook(db, { id: 'evt_2', type: 'x', data: { object: {} } }, { body: { id: 'evt_2' } });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'raw_body_required');
  });

  test('checkout.session.completed ativa o PRO', async () => {
    const { db, rows } = fakeDb([makeSub()]);
    const res = await postWebhook(db, {
      id: 'evt_3',
      type: 'checkout.session.completed',
      data: { object: { mode: 'subscription', client_reference_id: 'user-1', customer: 'cus_1', subscription: 'sub_1', payment_status: 'paid' } },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(rows[0].status, 'active');
    assert.equal(rows[0].plan, 'PERFORMANCE');
    assert.equal(rows[0].provider, 'stripe');
    assert.equal(rows[0].providerCustomerId, 'cus_1');
    assert.equal(rows[0].providerSubscriptionId, 'sub_1');
  });

  test('checkout de usuário inexistente é ignorado (sem criar assinatura)', async () => {
    const { db, rows } = fakeDb([], []);
    const res = await postWebhook(db, {
      id: 'evt_4',
      type: 'checkout.session.completed',
      data: { object: { mode: 'subscription', client_reference_id: 'fantasma', customer: 'cus_9', subscription: 'sub_9' } },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(rows.length, 0);
  });

  test('customer.subscription.deleted cancela e o acesso volta a ESSENCIAL', async () => {
    const { db, rows } = fakeDb([
      makeSub({ status: 'active', provider: 'stripe', providerCustomerId: 'cus_1', providerSubscriptionId: 'sub_1' }),
    ]);
    const res = await postWebhook(db, {
      id: 'evt_5',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_1', customer: 'cus_1', status: 'canceled' } },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(rows[0].status, 'canceled');
    assert.ok(rows[0].canceledAt);
    const access = resolveEffectiveAccess({ roleName: 'ESSENCIAL', email: 'cliente@exemplo.com' }, rows[0]);
    assert.equal(access.plan, 'ESSENCIAL');
    assert.equal(access.isExpired, true);
  });

  test('customer.subscription.updated sincroniza status e fim do período', async () => {
    const { db, rows } = fakeDb([makeSub({ provider: 'stripe', providerSubscriptionId: 'sub_1', providerCustomerId: 'cus_1' })]);
    await postWebhook(db, {
      id: 'evt_6',
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_1', customer: 'cus_1', status: 'active', current_period_end: 1_800_000_000 } },
    });
    assert.equal(rows[0].status, 'active');
    assert.equal(rows[0].currentPeriodEnd?.getTime(), 1_800_000_000_000);

    await postWebhook(db, {
      id: 'evt_7',
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_1', customer: 'cus_1', status: 'unpaid' } },
    });
    assert.equal(rows[0].status, 'canceled');
  });

  test('subscription.updated que chega antes do checkout acha o usuário pela metadata', async () => {
    const { db, rows } = fakeDb([makeSub()]);
    await postWebhook(db, {
      id: 'evt_8',
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_1', customer: 'cus_1', status: 'active', metadata: { userId: 'user-1' } } },
    });
    assert.equal(rows[0].status, 'active');
    assert.equal(rows[0].providerSubscriptionId, 'sub_1');
  });

  test('invoice.payment_failed põe em past_due só quem estava ativo', async () => {
    const { db, rows } = fakeDb([
      makeSub({ status: 'active', provider: 'stripe', providerSubscriptionId: 'sub_1', providerCustomerId: 'cus_1' }),
    ]);
    await postWebhook(db, {
      id: 'evt_9',
      type: 'invoice.payment_failed',
      data: { object: { subscription: 'sub_1', customer: 'cus_1' } },
    });
    assert.equal(rows[0].status, 'past_due');

    rows[0].status = 'canceled';
    await postWebhook(db, {
      id: 'evt_10',
      type: 'invoice.payment_failed',
      data: { object: { subscription: 'sub_1', customer: 'cus_1' } },
    });
    assert.equal(rows[0].status, 'canceled');
  });

  test('evento de tipo desconhecido responde 200', async () => {
    const { db } = fakeDb();
    const res = await postWebhook(db, { id: 'evt_11', type: 'charge.refunded', data: { object: {} } });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.action, 'ignored_event_type');
  });

  test('webhook cancelado não rebaixa admin PRO', async () => {
    process.env.ADMIN_PRO_EMAILS = 'dono@scout21.com.br';
    const { db, rows } = fakeDb([makeSub({ status: 'active', provider: 'stripe', providerSubscriptionId: 'sub_1' })]);
    await postWebhook(db, {
      id: 'evt_12',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_1' } },
    });
    assert.equal(rows[0].status, 'canceled');
    const access = resolveEffectiveAccess({ roleName: 'ESSENCIAL', email: 'dono@scout21.com.br' }, rows[0]);
    assert.equal(access.plan, 'PERFORMANCE');
    assert.equal(access.isExpired, false);
  });
});

describe('admin PRO', () => {
  test('é PRO mesmo com trial vencido, cancelado ou sem assinatura', () => {
    process.env.ADMIN_PRO_EMAILS = ' Dono@Scout21.com.br , outro@scout21.com.br';
    const user = { roleName: 'ESSENCIAL', email: 'dono@scout21.com.br' };

    for (const sub of [
      makeSub({ status: 'trialing', trialEndsAt: new Date('2020-01-01T00:00:00Z') }),
      makeSub({ status: 'expired' }),
      makeSub({ status: 'canceled' }),
      null,
    ]) {
      const access = resolveEffectiveAccess(user, sub);
      assert.equal(access.plan, 'PERFORMANCE');
      assert.equal(access.status, 'active');
      assert.equal(access.isExpired, false);
    }
  });

  test('nunca é bloqueado por e-mail não verificado', () => {
    process.env.ADMIN_PRO_EMAILS = 'dono@scout21.com.br';
    const old = makeSub({ trialStartedAt: new Date('2020-01-01T00:00:00Z') });
    assert.equal(isEmailVerificationOverdue({ roleName: 'ESSENCIAL', email: 'dono@scout21.com.br' }, old), false);
    assert.equal(isEmailVerificationOverdue({ roleName: 'ESSENCIAL', email: 'cliente@exemplo.com' }, old), true);
  });

  test('conta fora da lista continua sujeita ao trial (multi-tenancy intacto)', () => {
    process.env.ADMIN_PRO_EMAILS = 'dono@scout21.com.br';
    const access = resolveEffectiveAccess(
      { roleName: 'ESSENCIAL', email: 'cliente@exemplo.com' },
      makeSub({ status: 'trialing', trialEndsAt: new Date('2020-01-01T00:00:00Z') })
    );
    assert.equal(access.isExpired, true);
    assert.equal(access.plan, 'ESSENCIAL');
  });

  test('sem a env, ninguém é admin PRO', () => {
    const access = resolveEffectiveAccess(
      { roleName: 'ESSENCIAL', email: 'dono@scout21.com.br' },
      makeSub({ status: 'expired' })
    );
    assert.equal(access.isExpired, true);
  });

  test('admin PRO não consegue abrir checkout', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    process.env.STRIPE_PRICE_ID_PRO = 'price_fake';
    process.env.ADMIN_PRO_EMAILS = 'dono@scout21.com.br';
    const { db } = fakeDb([makeSub()]);
    await assert.rejects(
      () => createCheckoutSession(db, { id: 'user-1', email: 'dono@scout21.com.br' }, async () => {
        throw new Error('não deve chamar o Stripe');
      }),
      (error: unknown) => error instanceof BillingError && error.code === 'already_pro'
    );
  });
});

describe('sem chaves do Stripe', () => {
  test('billing fica desligado e nada chama a rede', async () => {
    assert.equal(isCheckoutEnabled(), false);
    assert.equal(isPortalEnabled(), false);
    assert.equal(isWebhookEnabled(), false);

    const { db } = fakeDb([makeSub()]);
    const neverCalled = async () => {
      throw new Error('não deve chamar o Stripe');
    };
    await assert.rejects(
      () => createCheckoutSession(db, { id: 'user-1', email: 'a@b.com' }, neverCalled),
      (error: unknown) => error instanceof BillingError && error.status === 503
    );
    await assert.rejects(
      () => createPortalSession(db, { id: 'user-1', email: 'a@b.com' }, neverCalled),
      (error: unknown) => error instanceof BillingError && error.status === 503
    );
  });

  test('webhook responde 503 sem STRIPE_WEBHOOK_SECRET', async () => {
    const { db } = fakeDb([makeSub()]);
    const res = await postWebhook(db, { id: 'evt', type: 'x', data: { object: {} } });
    assert.equal(res.statusCode, 503);
  });

  test('trial e acesso seguem normais sem nenhuma variável', () => {
    const access = resolveEffectiveAccess(
      { roleName: 'ESSENCIAL', email: 'cliente@exemplo.com' },
      makeSub({ status: 'trialing', trialEndsAt: new Date(Date.now() + 5 * 86_400_000) })
    );
    assert.equal(access.isTrialing, true);
    assert.equal(access.isExpired, false);
  });
});

describe('checkout e portal (com chaves de teste falsas e fetch simulado)', () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    process.env.STRIPE_PRICE_ID_PRO = 'price_fake';
  });

  test('checkout envia o preço PRO e o userId do usuário autenticado', async () => {
    const { db } = fakeDb([makeSub()]);
    let captured: { url: string; body: string } | null = null;
    const result = await createCheckoutSession(db, { id: 'user-1', email: 'cliente@exemplo.com' }, async (url, init) => {
      captured = { url, body: init.body || '' };
      return { ok: true, status: 200, json: async () => ({ url: 'https://checkout.stripe.test/s' }) };
    });

    assert.equal(result.url, 'https://checkout.stripe.test/s');
    const body = decodeURIComponent(captured!.body);
    assert.match(captured!.url, /checkout\/sessions$/);
    assert.match(body, /line_items\[0\]\[price\]=price_fake/);
    assert.match(body, /client_reference_id=user-1/);
    assert.match(body, /subscription_data\[metadata\]\[userId\]=user-1/);
  });

  test('portal usa o customer da própria conta e recusa quem não assinou', async () => {
    const paid = fakeDb([makeSub({ status: 'active', provider: 'stripe', providerCustomerId: 'cus_1' })]);
    let body = '';
    const result = await createPortalSession(paid.db, { id: 'user-1', email: 'a@b.com' }, async (_url, init) => {
      body = init.body || '';
      return { ok: true, status: 200, json: async () => ({ url: 'https://portal.stripe.test/p' }) };
    });
    assert.equal(result.url, 'https://portal.stripe.test/p');
    assert.match(body, /customer=cus_1/);

    const unpaid = fakeDb([makeSub()]);
    await assert.rejects(
      () => createPortalSession(unpaid.db, { id: 'user-1', email: 'a@b.com' }, async () => {
        throw new Error('não deve chamar o Stripe');
      }),
      (error: unknown) => error instanceof BillingError && error.code === 'no_customer'
    );
  });
});
