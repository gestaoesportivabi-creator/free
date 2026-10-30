import type Stripe from 'stripe';
import prisma from '../../config/database';
import { isLifetimeProAccount, type PlanName } from '../../utils/subscription.helper';
import {
  commandFromStripeEvent,
  guardBillingWrite,
  localStatusFor,
  unresolvedRiskLookup,
  type ProBillingCommand,
} from './proSync';
import { buildProCheckoutParams } from './stripeCheckout';
import { getStripeClient } from './stripeClient';
import {
  billingReadiness,
  getProPriceId,
  publicAppUrl,
  safeStripeError,
  type ProInterval,
} from './stripeConfig';

export class BillingDisabledError extends Error {
  constructor(message = 'Pagamento ainda não está ligado neste ambiente.') {
    super(message);
    this.name = 'BillingDisabledError';
  }
}

export class LifetimeProError extends Error {
  constructor() {
    super('Esta conta já é PRO permanente e não usa o Stripe.');
    this.name = 'LifetimeProError';
  }
}

export class BillingInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BillingInputError';
  }
}

function asPlan(value: string | null | undefined): PlanName {
  if (value === 'ESSENCIAL' || value === 'COMPETICAO' || value === 'PERFORMANCE' || value === 'PRO') {
    return value;
  }
  return 'PERFORMANCE';
}

async function loadUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, subscription: true },
  });
}

function assertNotLifetime(user: {
  email: string;
  role: { name: string };
  subscription: Parameters<typeof isLifetimeProAccount>[1];
}) {
  if (isLifetimeProAccount({ roleName: user.role.name, email: user.email }, user.subscription)) {
    throw new LifetimeProError();
  }
}

export async function createProCheckout(userId: string, interval: ProInterval): Promise<string> {
  const readiness = billingReadiness();
  if (!readiness.enabled) throw new BillingDisabledError();
  const priceId = getProPriceId(interval);
  if (!priceId) throw new BillingDisabledError('Este intervalo do PRO ainda não tem preço configurado.');

  const stripe = getStripeClient();
  if (!stripe) throw new BillingDisabledError();

  const user = await loadUser(userId);
  if (!user) throw new BillingInputError('Usuário não encontrado.');
  if (user.role.name === 'ATLETA') throw new BillingInputError('O plano PRO é da conta da comissão técnica.');
  assertNotLifetime(user);

  let customerId = user.subscription?.providerCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create(
      {
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      },
      { idempotencyKey: `scout21_customer_${user.id}` }
    );
    customerId = customer.id;
    if (user.subscription) {
      await prisma.subscription.update({
        where: { userId: user.id },
        data: { providerCustomerId: customerId },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: asPlan(user.role.name),
          status: 'active',
          providerCustomerId: customerId,
        },
      });
    }
  }

  const appUrl = publicAppUrl();
  if (!appUrl) throw new BillingInputError('FRONTEND_URL não está configurada.');
  const session = await stripe.checkout.sessions.create(
    buildProCheckoutParams({
      customerId,
      priceId,
      userId: user.id,
      interval,
      successUrl: `${appUrl}/planos/conta?checkout=success`,
      cancelUrl: `${appUrl}/planos?checkout=cancel`,
    })
  );

  if (!session.url) throw new BillingInputError('O Stripe não devolveu o endereço do checkout.');
  return session.url;
}

export async function createProPortal(userId: string): Promise<string> {
  if (!billingReadiness().secret) throw new BillingDisabledError();
  const stripe = getStripeClient();
  if (!stripe) throw new BillingDisabledError();

  const user = await loadUser(userId);
  if (!user) throw new BillingInputError('Usuário não encontrado.');
  assertNotLifetime(user);

  const customerId = user.subscription?.providerCustomerId;
  if (!customerId || user.subscription?.provider !== 'stripe') {
    throw new BillingInputError('Ainda não há assinatura Stripe nesta conta.');
  }

  const appUrl = publicAppUrl();
  if (!appUrl) throw new BillingInputError('FRONTEND_URL não está configurada.');
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/planos/conta`,
  });
  return session.url;
}

async function findUserForCommand(command: ProBillingCommand) {
  if (command.userId) {
    const byId = await loadUser(command.userId);
    if (byId) return byId;
  }
  if (command.subscriptionId) {
    const row = await prisma.subscription.findFirst({
      where: { providerSubscriptionId: command.subscriptionId },
      include: { user: { include: { role: true, subscription: true } } },
    });
    if (row?.user) return row.user;
  }
  if (command.customerId) {
    const row = await prisma.subscription.findFirst({
      where: { providerCustomerId: command.customerId },
      include: { user: { include: { role: true, subscription: true } } },
    });
    if (row?.user) return row.user;
  }
  return null;
}

export async function applyBillingCommand(command: ProBillingCommand): Promise<'applied' | 'skipped' | 'unresolved'> {
  if (command.action === 'ignore') return 'skipped';

  const user = await findUserForCommand(command);
  if (!user) return 'unresolved';

  if (isLifetimeProAccount({ roleName: user.role.name, email: user.email }, user.subscription)) {
    return 'skipped';
  }

  if (!guardBillingWrite(user.subscription, command.action)) return 'skipped';

  const status = localStatusFor(command.action);
  if (!status) return 'skipped';

  const periodEnd = command.periodEndUnix ? new Date(command.periodEndUnix * 1000) : undefined;
  const canceledAt = status === 'canceled' ? new Date() : status === 'active' ? null : undefined;

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan: 'PRO',
      status,
      provider: 'stripe',
      providerCustomerId: command.customerId,
      providerSubscriptionId: command.subscriptionId,
      currentPeriodEnd: periodEnd ?? null,
      canceledAt: status === 'canceled' ? new Date() : null,
    },
    update: {
      plan: 'PRO',
      status,
      provider: 'stripe',
      ...(command.customerId ? { providerCustomerId: command.customerId } : {}),
      ...(command.subscriptionId ? { providerSubscriptionId: command.subscriptionId } : {}),
      ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
      ...(canceledAt !== undefined ? { canceledAt } : {}),
    },
  });

  return 'applied';
}

async function enrichRiskCommand(command: ProBillingCommand, event: Stripe.Event, stripe: Stripe | null): Promise<ProBillingCommand> {
  if (command.customerId || command.userId || command.subscriptionId) return command;
  const lookup = unresolvedRiskLookup(event);
  if (!lookup || !stripe) return command;

  if (lookup.chargeId) {
    const charge = await stripe.charges.retrieve(lookup.chargeId);
    return { ...command, customerId: typeof charge.customer === 'string' ? charge.customer : charge.customer?.id ?? null };
  }
  if (lookup.paymentIntentId) {
    const intent = await stripe.paymentIntents.retrieve(lookup.paymentIntentId);
    return { ...command, customerId: typeof intent.customer === 'string' ? intent.customer : intent.customer?.id ?? null };
  }
  return command;
}

export async function handleStripeEvent(event: Stripe.Event): Promise<'applied' | 'skipped' | 'unresolved'> {
  const command = await enrichRiskCommand(commandFromStripeEvent(event), event, getStripeClient());
  const result = await applyBillingCommand(command);
  console.info('[billing] webhook', event.type, event.id, result);
  return result;
}

export function logBillingFailure(error: unknown): void {
  console.error('[billing]', safeStripeError(error));
}
