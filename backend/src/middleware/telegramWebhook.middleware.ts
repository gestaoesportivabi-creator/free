/**
 * Valida X-Telegram-Bot-Api-Secret-Token do webhook.
 * Se TELEGRAM_WEBHOOK_SECRET estiver definido, header ausente ou diferente → 401.
 * Sem a variável, o webhook segue sem essa checagem (defina o secret em produção).
 */

import { timingSafeEqual } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export type TelegramWebhookSecretDecision = 'unconfigured' | 'match' | 'reject';

/** Compara o header com o valor exato da env. Não registra o secret. */
export function telegramWebhookSecretMatches(
  configuredSecret: string | undefined | null,
  header: string | undefined | null
): TelegramWebhookSecretDecision {
  if (!configuredSecret?.trim()) return 'unconfigured';
  const provided = header ?? '';
  const left = Buffer.from(provided);
  const right = Buffer.from(configuredSecret);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return 'reject';
  return 'match';
}

export function telegramWebhookSecretMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const decision = telegramWebhookSecretMatches(
    env.TELEGRAM_WEBHOOK_SECRET,
    req.get('X-Telegram-Bot-Api-Secret-Token')
  );

  if (decision === 'unconfigured') {
    console.warn(
      '[Telegram] TELEGRAM_WEBHOOK_SECRET ausente — webhook aceito sem validação. Defina o secret e rode register-webhook.'
    );
    return next();
  }

  if (decision === 'reject') {
    console.error('[Telegram] Webhook rejeitado: secret não confere com TELEGRAM_WEBHOOK_SECRET');
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  next();
}
