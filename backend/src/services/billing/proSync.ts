import type Stripe from 'stripe';

export type ProBillingAction = 'activate' | 'past_due' | 'cancel' | 'ignore';

export interface ProBillingCommand {
  action: ProBillingAction;
  userId: string | null;
  customerId: string | null;
  subscriptionId: string | null;
  periodEndUnix: number | null;
  reason: string;
}

export interface ExistingBillingRow {
  provider: string | null;
  plan: string;
  status: string;
}

type Obj = Record<string, unknown>;

function ignore(reason: string): ProBillingCommand {
  return {
    action: 'ignore',
    userId: null,
    customerId: null,
    subscriptionId: null,
    periodEndUnix: null,
    reason,
  };
}

function idOf(value: unknown): string | null {
  if (typeof value === 'string' && value) return value;
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === 'string' && id) return id;
  }
  return null;
}

function asObj(value: unknown): Obj | null {
  if (value && typeof value === 'object') return value as Obj;
  return null;
}

function metaUserId(obj: Obj): string | null {
  const metadata = asObj(obj.metadata);
  if (metadata && typeof metadata.userId === 'string' && metadata.userId) return metadata.userId;
  const parent = asObj(obj.parent);
  const details = asObj(parent?.subscription_details);
  const subMeta = asObj(details?.metadata);
  if (subMeta && typeof subMeta.userId === 'string' && subMeta.userId) return subMeta.userId;
  return null;
}

export function subscriptionPeriodEndUnix(obj: Obj): number | null {
  const items = asObj(obj.items);
  const data = items?.data;
  if (!Array.isArray(data) || !data.length) return null;
  const first = asObj(data[0]);
  const end = first?.current_period_end;
  return typeof end === 'number' ? end : null;
}

function invoiceSubscriptionId(obj: Obj): string | null {
  const direct = idOf(obj.subscription);
  if (direct) return direct;
  const parent = asObj(obj.parent);
  const details = asObj(parent?.subscription_details);
  return idOf(details?.subscription);
}

export function mapStripeSubscriptionStatus(status: string): ProBillingAction {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'activate';
    case 'past_due':
    case 'paused':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'cancel';
    default:
      return 'ignore';
  }
}

export function localStatusFor(action: ProBillingAction): 'active' | 'past_due' | 'canceled' | null {
  if (action === 'activate') return 'active';
  if (action === 'past_due') return 'past_due';
  if (action === 'cancel') return 'canceled';
  return null;
}

/**
 * Falha de pagamento ou cancelamento só mexe em quem já é cliente Stripe.
 * Sem isto, um invoice.payment_failed no meio do teste libertava o PRO
 * ou um evento solto marcava o teste como cancelado.
 */
export function guardBillingWrite(existing: ExistingBillingRow | null, action: ProBillingAction): boolean {
  if (action === 'ignore') return false;
  if (action === 'activate') return true;
  return existing?.provider === 'stripe';
}

function filled(command: Omit<ProBillingCommand, 'userId' | 'customerId' | 'subscriptionId' | 'periodEndUnix'> & Partial<ProBillingCommand>): ProBillingCommand {
  return {
    action: command.action,
    userId: command.userId ?? null,
    customerId: command.customerId ?? null,
    subscriptionId: command.subscriptionId ?? null,
    periodEndUnix: command.periodEndUnix ?? null,
    reason: command.reason,
  };
}

export function commandFromStripeEvent(event: Pick<Stripe.Event, 'type' | 'data'>): ProBillingCommand {
  const obj = asObj(event.data?.object) ?? {};
  const type = event.type;

  if (
    type === 'checkout.session.completed' ||
    type === 'checkout.session.async_payment_succeeded' ||
    type === 'checkout.session.async_payment_failed'
  ) {
    if (obj.mode && obj.mode !== 'subscription') return ignore('not_subscription');
    if (type === 'checkout.session.async_payment_failed') return ignore('async_payment_failed');
    const paymentStatus = typeof obj.payment_status === 'string' ? obj.payment_status : '';
    if (paymentStatus !== 'paid' && paymentStatus !== 'no_payment_required') {
      return ignore('payment_pending');
    }
    return filled({
      action: 'activate',
      userId: (typeof obj.client_reference_id === 'string' && obj.client_reference_id) || metaUserId(obj),
      customerId: idOf(obj.customer),
      subscriptionId: idOf(obj.subscription),
      reason: type,
    });
  }

  if (
    type === 'customer.subscription.created' ||
    type === 'customer.subscription.updated' ||
    type === 'customer.subscription.deleted'
  ) {
    const status = typeof obj.status === 'string' ? obj.status : '';
    const action = type === 'customer.subscription.deleted' ? 'cancel' : mapStripeSubscriptionStatus(status);
    if (action === 'ignore') return ignore(type);
    return filled({
      action,
      userId: metaUserId(obj),
      customerId: idOf(obj.customer),
      subscriptionId: idOf(obj.id) || idOf(obj),
      periodEndUnix: subscriptionPeriodEndUnix(obj),
      reason: type,
    });
  }

  if (type === 'invoice.paid' || type === 'invoice.payment_failed') {
    const subscriptionId = invoiceSubscriptionId(obj);
    if (!subscriptionId) return ignore('invoice_without_subscription');
    return filled({
      action: type === 'invoice.paid' ? 'activate' : 'past_due',
      userId: metaUserId(obj),
      customerId: idOf(obj.customer),
      subscriptionId,
      reason: type,
    });
  }

  if (type === 'charge.dispute.created' || type === 'radar.early_fraud_warning.created') {
    const paymentIntent = asObj(obj.payment_intent);
    const charge = asObj(obj.charge);
    return filled({
      action: 'past_due',
      customerId: idOf(paymentIntent?.customer) || idOf(charge?.customer) || idOf(obj.customer),
      reason: type,
    });
  }

  if (type === 'charge.refunded') {
    const amount = typeof obj.amount === 'number' ? obj.amount : 0;
    const refundedAmount = typeof obj.amount_refunded === 'number' ? obj.amount_refunded : 0;
    const full = obj.refunded === true || (amount > 0 && refundedAmount >= amount);
    return filled({
      action: full ? 'cancel' : 'past_due',
      customerId: idOf(obj.customer),
      reason: type,
    });
  }

  return ignore(type);
}

/** IDs ainda por buscar na API quando o evento de risco não veio expandido. */
export function unresolvedRiskLookup(event: Pick<Stripe.Event, 'type' | 'data'>): { chargeId?: string; paymentIntentId?: string } | null {
  const obj = asObj(event.data?.object) ?? {};
  if (event.type === 'radar.early_fraud_warning.created' && typeof obj.charge === 'string') {
    return { chargeId: obj.charge };
  }
  if (event.type === 'charge.dispute.created' && typeof obj.payment_intent === 'string') {
    return { paymentIntentId: obj.payment_intent };
  }
  return null;
}
