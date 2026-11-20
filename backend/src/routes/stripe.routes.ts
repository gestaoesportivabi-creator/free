/**
 * Rotas do Stripe.
 *
 *  • POST /api/stripe/webhook — público, protegido pela assinatura. Precisa do
 *    corpo CRU, por isso o router usa `express.raw` e é montado em app.ts ANTES
 *    de `express.json()`.
 *  • POST /api/billing/checkout e /portal — usuário autenticado (staff). Não passam
 *    por requireActiveSubscription: quem está com o teste expirado precisa poder pagar.
 */

import express, { Request, Response, Router } from 'express';
import prisma from '../config/database';
import { getStripeConfig, isWebhookEnabled } from '../config/stripe';
import {
  BillingDb,
  BillingError,
  createCheckoutSession,
  createPortalSession,
  handleStripeEvent,
} from '../services/billing.service';
import { verifyStripeSignature } from '../services/stripe/signature';

export function createStripeWebhookHandler(db: BillingDb = prisma) {
  return async (req: Request, res: Response) => {
    const config = getStripeConfig();
    if (!isWebhookEnabled(config)) {
      return res.status(503).json({ success: false, error: 'stripe_disabled' });
    }

    // Sem corpo cru não há como conferir a assinatura (ex.: um parser JSON rodou antes).
    const rawBody = req.body;
    if (!Buffer.isBuffer(rawBody) && typeof rawBody !== 'string') {
      return res.status(400).json({ success: false, error: 'raw_body_required' });
    }

    const signature = req.headers['stripe-signature'];
    const header = Array.isArray(signature) ? signature[0] : signature;
    if (!verifyStripeSignature(rawBody, header, config.webhookSecret)) {
      return res.status(400).json({ success: false, error: 'invalid_signature' });
    }

    try {
      const text = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
      const result = await handleStripeEvent(db, JSON.parse(text));
      return res.json({ success: true, received: true, action: result.action });
    } catch (error) {
      // 500 faz o Stripe reenviar o evento mais tarde.
      console.error('[stripe/webhook] falha ao processar evento:', error instanceof Error ? error.message : error);
      return res.status(500).json({ success: false, error: 'webhook_failed' });
    }
  };
}

export const stripeWebhookRouter = Router();
stripeWebhookRouter.post('/webhook', express.raw({ type: '*/*', limit: '1mb' }), createStripeWebhookHandler());

function respondBillingError(res: Response, error: unknown) {
  if (error instanceof BillingError) {
    return res.status(error.status).json({ success: false, error: error.code, message: error.message });
  }
  console.error('[billing] erro inesperado:', error instanceof Error ? error.message : error);
  return res.status(502).json({
    success: false,
    error: 'billing_failed',
    message: 'Não foi possível falar com o serviço de pagamento agora. Tente novamente em instantes.',
  });
}

export const billingRouter = Router();

billingRouter.post('/checkout', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const data = await createCheckoutSession(prisma, { id: user.id, email: user.email });
    return res.json({ success: true, data });
  } catch (error) {
    return respondBillingError(res, error);
  }
});

billingRouter.post('/portal', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const data = await createPortalSession(prisma, { id: user.id, email: user.email });
    return res.json({ success: true, data });
  } catch (error) {
    return respondBillingError(res, error);
  }
});
