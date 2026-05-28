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
  if (!env.TELEGRAM_WEBHOOK_SECRET) {
    if (env.NODE_ENV === 'production') {
      return res.status(503).json({ success: false, error: 'Webhook Telegram não configurado' });
    }
    return next();
  }

  const header = req.get('X-Telegram-Bot-Api-Secret-Token');
  if (header !== env.TELEGRAM_WEBHOOK_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
}
