/**
 * Billing (Stripe): checkout do plano PRO, portal do cliente e processamento
 * dos eventos do webhook.
 *
 * PRO = plano Scout `PERFORMANCE` (o mesmo que o trial concede).
 * O estado fica em `Subscription` (provider/providerCustomerId/providerSubscriptionId),
 * sem mudança de schema. Admin PRO nunca passa por aqui para perder acesso:
 * `resolveEffectiveAccess` olha a lista de admins antes de qualquer status.
 *
 * Multi-tenancy: o checkout e o portal só operam sobre o usuário autenticado;
 * o webhook só toca a assinatura identificada pelo evento já verificado.
 */

import type { PrismaClient, SubscriptionStatus } from '@prisma/client';
import { getStripeConfig, isCheckoutEnabled, isPortalEnabled } from '../config/stripe';
import { isAdminProEmail } from '../utils/adminPro';
import { FetchLike, stripePost } from './stripe/client';

export type BillingDb = Pick<PrismaClient, 'subscription' | 'user'>;

export class BillingError extends Error {
  constructor(message: string, public status: number, public code: string) {
    super(message);
    this.name = 'BillingError';
  }
}

export interface StripeEvent {
  id: string;
  type: string;
  data: { object: any };
}

export interface EventResult {
  handled: boolean;
  action: string;
}

/** Status do Stripe → status interno. `null` = ignorar (ex.: `incomplete`). */
export function mapStripeStatus(status: string | undefined): SubscriptionStatus | null {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return null;
  }
}

function idOf(value: unknown): string | null {
  if (typeof value === 'string' && value) return value;
  if (value && typeof value === 'object' && typeof (value as any).id === 'string') return (value as any).id;
  return null;
}

function periodEndOf(subscription: any): Date | null {
  // Versões novas da API movem current_period_end para os itens.
  const seconds = subscription?.current_period_end ?? subscription?.items?.data?.[0]?.current_period_end;
  return typeof seconds === 'number' ? new Date(seconds * 1000) : null;
}

/** Localiza a assinatura Scout de um objeto subscription do Stripe. */
async function findScoutSubscription(db: BillingDb, stripeSub: any) {
  const subscriptionId = idOf(stripeSub?.id);
  if (subscriptionId) {
    const bySubscription = await db.subscription.findFirst({ where: { providerSubscriptionId: subscriptionId } });
    if (bySubscription) return bySubscription;
  }
  // Pode chegar antes do checkout.session.completed: a metadata leva o userId.
  const userId = stripeSub?.metadata?.userId;
  if (typeof userId === 'string' && userId) {
    const byUser = await db.subscription.findUnique({ where: { userId } });
    if (byUser) return byUser;
  }
  const customerId = idOf(stripeSub?.customer);
  if (customerId) {
    return db.subscription.findFirst({ where: { provider: 'stripe', providerCustomerId: customerId } });
  }
  return null;
}

async function onCheckoutCompleted(db: BillingDb, session: any): Promise<EventResult> {
  if (session?.mode !== 'subscription') return { handled: false, action: 'ignored_not_subscription' };
  if (session.payment_status === 'unpaid') return { handled: false, action: 'ignored_unpaid' };

  const userId = session.client_reference_id || session.metadata?.userId;
  if (typeof userId !== 'string' || !userId) return { handled: false, action: 'ignored_no_user' };

  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { handled: false, action: 'ignored_unknown_user' };

  const data = {
    plan: getStripeConfig().proPlan,
    status: 'active' as const,
    provider: 'stripe',
    providerCustomerId: idOf(session.customer),
    providerSubscriptionId: idOf(session.subscription),
    canceledAt: null,
  };
  await db.subscription.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
  return { handled: true, action: 'pro_activated' };
}

async function onSubscriptionUpdated(db: BillingDb, stripeSub: any): Promise<EventResult> {
  const status = mapStripeStatus(stripeSub?.status);
  if (!status) return { handled: false, action: 'ignored_status' };

  const record = await findScoutSubscription(db, stripeSub);
  if (!record) return { handled: false, action: 'ignored_unknown_subscription' };

  await db.subscription.update({
    where: { id: record.id },
    data: {
      status,
      plan: status === 'canceled' ? record.plan : getStripeConfig().proPlan,
      provider: 'stripe',
      providerCustomerId: idOf(stripeSub.customer) ?? record.providerCustomerId,
      providerSubscriptionId: idOf(stripeSub.id) ?? record.providerSubscriptionId,
      currentPeriodEnd: periodEndOf(stripeSub) ?? record.currentPeriodEnd,
      canceledAt: status === 'canceled' ? record.canceledAt ?? new Date() : null,
    },
  });
  return { handled: true, action: status === 'canceled' ? 'pro_deactivated' : `status_${status}` };
}

async function onSubscriptionDeleted(db: BillingDb, stripeSub: any): Promise<EventResult> {
  const record = await findScoutSubscription(db, stripeSub);
  if (!record) return { handled: false, action: 'ignored_unknown_subscription' };

  await db.subscription.update({
    where: { id: record.id },
    data: { status: 'canceled', canceledAt: new Date() },
  });
  return { handled: true, action: 'pro_deactivated' };
}

async function onInvoicePaymentFailed(db: BillingDb, invoice: any): Promise<EventResult> {
  const subscriptionId =
    idOf(invoice?.subscription) ?? idOf(invoice?.parent?.subscription_details?.subscription);
  const customerId = idOf(invoice?.customer);

  const record = subscriptionId
    ? await db.subscription.findFirst({ where: { providerSubscriptionId: subscriptionId } })
    : customerId
      ? await db.subscription.findFirst({ where: { provider: 'stripe', providerCustomerId: customerId } })
      : null;
  if (!record) return { handled: false, action: 'ignored_unknown_subscription' };

  // Só rebaixa quem estava ativo; `past_due` mantém o período de cortesia
  // definido em resolveEffectiveAccess. O corte final vem em subscription.updated/deleted.
  if (record.status !== 'active') return { handled: false, action: 'ignored_not_active' };

  await db.subscription.update({ where: { id: record.id }, data: { status: 'past_due' } });
  return { handled: true, action: 'status_past_due' };
}

export async function handleStripeEvent(db: BillingDb, event: StripeEvent): Promise<EventResult> {
  const object = event?.data?.object;
  switch (event?.type) {
    case 'checkout.session.completed':
      return onCheckoutCompleted(db, object);
    case 'customer.subscription.updated':
      return onSubscriptionUpdated(db, object);
    case 'customer.subscription.deleted':
      return onSubscriptionDeleted(db, object);
    case 'invoice.payment_failed':
      return onInvoicePaymentFailed(db, object);
    default:
      return { handled: false, action: 'ignored_event_type' };
  }
}

interface BillingUser {
  id: string;
  email: string;
}

export async function createCheckoutSession(
  db: BillingDb,
  user: BillingUser,
  fetchImpl?: FetchLike
): Promise<{ url: string }> {
  const config = getStripeConfig();
  if (!isCheckoutEnabled(config)) {
    throw new BillingError('Pagamento online ainda não está disponível. Fale com a gente pelo WhatsApp.', 503, 'billing_disabled');
  }
  if (isAdminProEmail(user.email)) {
    throw new BillingError('Sua conta já é PRO, não precisa assinar.', 409, 'already_pro');
  }

  const existing = await db.subscription.findUnique({ where: { userId: user.id } });
  if ((existing?.status === 'active' || existing?.status === 'past_due') && existing.providerSubscriptionId) {
    throw new BillingError('Você já tem uma assinatura ativa. Use "Gerenciar assinatura".', 409, 'already_subscribed');
  }

  const session = await stripePost<{ url?: string }>(
    config.secretKey,
    'checkout/sessions',
    {
      mode: 'subscription',
      line_items: [{ price: config.pricePro, quantity: 1 }],
      client_reference_id: user.id,
      ...(existing?.provider === 'stripe' && existing.providerCustomerId
        ? { customer: existing.providerCustomerId }
        : { customer_email: user.email }),
      metadata: { userId: user.id },
      subscription_data: { metadata: { userId: user.id } },
      allow_promotion_codes: true,
      locale: 'pt-BR',
      success_url: `${config.frontendUrl}/?checkout=success`,
      cancel_url: `${config.frontendUrl}/?checkout=cancel`,
    },
    fetchImpl
  );

  if (!session.url) throw new BillingError('Não foi possível iniciar o pagamento.', 502, 'checkout_failed');
  return { url: session.url };
}

export async function createPortalSession(
  db: BillingDb,
  user: BillingUser,
  fetchImpl?: FetchLike
): Promise<{ url: string }> {
  const config = getStripeConfig();
  if (!isPortalEnabled(config)) {
    throw new BillingError('Gestão de assinatura ainda não está disponível.', 503, 'billing_disabled');
  }

  const existing = await db.subscription.findUnique({ where: { userId: user.id } });
  if (existing?.provider !== 'stripe' || !existing.providerCustomerId) {
    throw new BillingError('Nenhuma assinatura paga encontrada nesta conta.', 404, 'no_customer');
  }

  const session = await stripePost<{ url?: string }>(
    config.secretKey,
    'billing_portal/sessions',
    { customer: existing.providerCustomerId, return_url: `${config.frontendUrl}/` },
    fetchImpl
  );

  if (!session.url) throw new BillingError('Não foi possível abrir o portal.', 502, 'portal_failed');
  return { url: session.url };
}
