import Stripe from 'stripe';
import { getStripeSecretKey } from './stripeConfig';

let cached: Stripe | null = null;
let cachedKey: string | null = null;

/** Null quando STRIPE_SECRET_KEY não está definida. Não chama a API. */
export function getStripeClient(): Stripe | null {
  const key = getStripeSecretKey();
  if (!key) return null;
  if (cached && cachedKey === key) return cached;
  cached = new Stripe(key);
  cachedKey = key;
  return cached;
}

/**
 * Verificação de assinatura não precisa da secret key.
 * O placeholder não é uma chave Stripe e nunca é enviado à API.
 */
export function getWebhookStripeClient(): Stripe {
  return getStripeClient() ?? new Stripe('billing-disabled-placeholder');
}
