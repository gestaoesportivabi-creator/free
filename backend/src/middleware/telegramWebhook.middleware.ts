/**
 * Valida X-Telegram-Bot-Api-Secret-Token do webhook
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function telegramWebhookSecretMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!env.TELEGRAM_WEBHOOK_SECRET?.trim()) {
    console.warn(
      '[Telegram] TELEGRAM_WEBHOOK_SECRET ausente — webhook aceito sem validação. Defina o secret e rode register-webhook.'
    );
    return next();
  }

  const header = req.get('X-Telegram-Bot-Api-Secret-Token');
  if (header !== env.TELEGRAM_WEBHOOK_SECRET) {
    console.error('[Telegram] Webhook rejeitado: secret não confere com TELEGRAM_WEBHOOK_SECRET');
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
}
