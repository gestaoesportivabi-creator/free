/**
 * Stripe só liga quando as variáveis existem. Sem elas, o billing fica desligado
 * e nenhum módulo deve lançar na subida do servidor.
 */

export type ProInterval = 'month' | 'year';

export interface BillingReadiness {
  /** Checkout + webhook prontos. Sem isto a UI não oferece pagamento. */
  enabled: boolean;
  secret: boolean;
  webhook: boolean;
  monthly: boolean;
  yearly: boolean;
  /** Chave publicável (pk_). Pode ir ao browser; nunca é a secret key. */
  publishableKey: string | null;
}

function trimmed(name: string): string {
  return process.env[name]?.trim() || '';
}

export function getStripeSecretKey(): string {
  return trimmed('STRIPE_SECRET_KEY');
}

export function getStripeWebhookSecret(): string {
  return trimmed('STRIPE_WEBHOOK_SECRET');
}

/** Preço do PRO. STRIPE_PRICE_PRO é o mensal quando STRIPE_PRICE_PRO_MONTHLY não existe. */
export function getProPriceId(interval: ProInterval): string {
  if (interval === 'year') return trimmed('STRIPE_PRICE_PRO_YEARLY');
  return trimmed('STRIPE_PRICE_PRO_MONTHLY') || trimmed('STRIPE_PRICE_PRO');
}

export function billingReadiness(): BillingReadiness {
  const secret = Boolean(getStripeSecretKey());
  const webhook = Boolean(getStripeWebhookSecret());
  const monthly = Boolean(getProPriceId('month'));
  const yearly = Boolean(getProPriceId('year'));
  const publishableKey = trimmed('STRIPE_PUBLISHABLE_KEY') || null;
  return {
    enabled: secret && webhook && (monthly || yearly),
    secret,
    webhook,
    monthly,
    yearly,
    publishableKey,
  };
}

/** URL do app para o retorno do Checkout. Sem FRONTEND_URL o checkout não abre. */
export function publicAppUrl(): string | null {
  const raw = trimmed('FRONTEND_URL');
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

export function safeStripeError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'error';
  return message.replace(/[sr]k_(live|test)_[A-Za-z0-9]+/g, '[redacted]');
}
