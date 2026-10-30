import { Request, Response } from 'express';
import {
  BillingDisabledError,
  BillingInputError,
  LifetimeProError,
  createProCheckout,
  createProPortal,
  handleStripeEvent,
  logBillingFailure,
} from '../services/billing/billing.service';
import { getStripeWebhookSecret, billingReadiness } from '../services/billing/stripeConfig';
import { getWebhookStripeClient } from '../services/billing/stripeClient';
import type { ProInterval } from '../services/billing/stripeConfig';

function sendBillingError(res: Response, error: unknown) {
  logBillingFailure(error);
  if (error instanceof BillingDisabledError) {
    return res.status(503).json({ success: false, error: 'billing_disabled', message: error.message });
  }
  if (error instanceof LifetimeProError) {
    return res.status(409).json({ success: false, error: 'lifetime_pro', message: error.message });
  }
  if (error instanceof BillingInputError) {
    return res.status(409).json({ success: false, error: 'billing_rejected', message: error.message });
  }
  return res.status(502).json({
    success: false,
    error: 'stripe_error',
    message: 'Não foi possível falar com o Stripe. Nada foi cobrado por esta tela.',
  });
}

export const billingController = {
  config(_req: Request, res: Response) {
    const readiness = billingReadiness();
    return res.json({
      success: true,
      data: {
        enabled: readiness.enabled,
        monthly: readiness.monthly,
        yearly: readiness.yearly,
        publishableKey: readiness.publishableKey,
      },
    });
  },

  async checkout(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Usuário não autenticado' });

    const interval: ProInterval | null =
      req.body?.interval === 'year' ? 'year' : req.body?.interval === 'month' ? 'month' : null;
    if (!interval) {
      return res.status(400).json({ success: false, error: 'interval_required' });
    }

    try {
      const url = await createProCheckout(userId, interval);
      return res.json({ success: true, data: { url } });
    } catch (error) {
      return sendBillingError(res, error);
    }
  },

  async portal(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
    try {
      const url = await createProPortal(userId);
      return res.json({ success: true, data: { url } });
    } catch (error) {
      return sendBillingError(res, error);
    }
  },
};

/** Corpo cru (Buffer). A assinatura do webhook é inválida se o JSON já tiver sido reparseado. */
export async function billingWebhookHandler(req: Request, res: Response) {
  const secret = getStripeWebhookSecret();
  if (!secret) {
    return res.status(503).json({
      success: false,
      error: 'billing_disabled',
      message: 'Webhook do Stripe ainda não está configurado.',
    });
  }

  const signatureHeader = req.headers['stripe-signature'];
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  if (!signature) {
    return res.status(400).json({ success: false, error: 'missing_signature' });
  }
  if (!Buffer.isBuffer(req.body)) {
    return res.status(400).json({ success: false, error: 'invalid_body' });
  }

  let event;
  try {
    event = getWebhookStripeClient().webhooks.constructEvent(req.body, signature, secret);
  } catch (error) {
    logBillingFailure(error);
    return res.status(400).json({ success: false, error: 'invalid_signature' });
  }

  try {
    const result = await handleStripeEvent(event);
    return res.json({ received: true, result });
  } catch (error) {
    logBillingFailure(error);
    return res.status(500).json({ success: false, error: 'webhook_failed' });
  }
}
