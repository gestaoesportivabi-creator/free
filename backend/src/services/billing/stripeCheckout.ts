import type Stripe from 'stripe';
import type { ProInterval } from './stripeConfig';

const SUFFIX = 'abcdefghijklmnopqrstuvwxyz';

/** Rótulo do fluxo no Dashboard. O sufixo tem 8 letras, como a API pede. */
export function integrationIdentifier(): string {
  let suffix = '';
  for (let i = 0; i < 8; i += 1) {
    suffix += SUFFIX[Math.floor(Math.random() * SUFFIX.length)];
  }
  return `scout21_pro_${suffix}`;
}

export function buildProCheckoutParams(input: {
  customerId: string;
  priceId: string;
  userId: string;
  interval: ProInterval;
  successUrl: string;
  cancelUrl: string;
}): Stripe.Checkout.SessionCreateParams {
  return {
    mode: 'subscription',
    customer: input.customerId,
    client_reference_id: input.userId,
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: { userId: input.userId, plan: 'PRO', interval: input.interval },
    subscription_data: {
      metadata: { userId: input.userId, plan: 'PRO' },
    },
    integration_identifier: integrationIdentifier(),
  };
}
