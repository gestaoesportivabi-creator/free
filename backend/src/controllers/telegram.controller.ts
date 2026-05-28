/**
 * Webhook Telegram Bot API
 */

import { Request, Response } from 'express';
import { env } from '../config/env';
import { handleTelegramUpdate } from '../services/telegram/telegramBot.service';
import {
  deleteTelegramWebhook,
  getTelegramMe,
  getTelegramWebhookInfo,
  isTelegramConfigured,
  setTelegramWebhook,
  TelegramUpdate,
} from '../services/telegram/telegramApi.client';
import { sendMorningReminders } from '../services/telegram/telegramReminders.service';

export const telegramController = {
  async webhook(req: Request, res: Response) {
    res.status(200).json({ ok: true });
    void handleTelegramUpdate(req.body as TelegramUpdate).catch((error) => {
      console.error('[Telegram webhook]', error);
    });
  },

  async status(_req: Request, res: Response) {
    return res.json({
      success: true,
      data: {
        configured: isTelegramConfigured(),
        polling: env.TELEGRAM_POLLING,
        webhookSecretSet: Boolean(env.TELEGRAM_WEBHOOK_SECRET),
      },
    });
  },

  /** POST body: { "url": "https://..." } — requer TELEGRAM_WEBHOOK_SECRET */
  async diagnose(_req: Request, res: Response) {
    if (!isTelegramConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'TELEGRAM_BOT_TOKEN não configurado na Vercel',
      });
    }
    try {
      const [me, webhookInfo] = await Promise.all([getTelegramMe(), getTelegramWebhookInfo()]);
      const expectedUrl = `${(env.PUBLIC_API_URL || 'https://gestaoesportiva-free.vercel.app').replace(/\/$/, '')}/api/telegram/webhook`;
      return res.json({
        success: true,
        data: {
          bot: me,
          webhook: webhookInfo,
          expectedWebhookUrl: expectedUrl,
          webhookMatches: webhookInfo.url === expectedUrl,
          env: {
            webhookSecretSet: Boolean(env.TELEGRAM_WEBHOOK_SECRET?.trim()),
            publicApiUrl: env.PUBLIC_API_URL || null,
          },
          hint:
            webhookInfo.url !== expectedUrl
              ? 'Rode POST /api/telegram/register-webhook após o deploy'
              : webhookInfo.last_error_message
                ? `Erro Telegram: ${webhookInfo.last_error_message}`
                : 'OK — envie /start no bot',
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao consultar Telegram';
      return res.status(500).json({ success: false, error: msg });
    }
  },

  async registerWebhook(req: Request, res: Response) {
    if (!isTelegramConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Configure TELEGRAM_BOT_TOKEN na Vercel',
      });
    }
    const base =
      (req.body?.url as string)?.replace(/\/$/, '') ||
      env.PUBLIC_API_URL.replace(/\/$/, '') ||
      `https://${req.get('host')}`;
    const webhookUrl = `${base}/api/telegram/webhook`;
    try {
      await deleteTelegramWebhook();
      await setTelegramWebhook(webhookUrl, env.TELEGRAM_WEBHOOK_SECRET || undefined);
      const webhookInfo = await getTelegramWebhookInfo();
      return res.json({ success: true, data: { webhookUrl, webhookInfo } });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Falha ao registrar webhook';
      return res.status(500).json({ success: false, error: msg });
    }
  },

  async deleteWebhook(_req: Request, res: Response) {
    await deleteTelegramWebhook();
    return res.json({ success: true });
  },

  /** Vercel Cron — header Authorization: Bearer CRON_SECRET */
  async cronReminders(req: Request, res: Response) {
    const auth = req.get('authorization') || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    if (!env.CRON_SECRET || token !== env.CRON_SECRET) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    if (!isTelegramConfigured()) {
      return res.json({ success: true, data: { sent: 0, skipped: 0, reason: 'telegram_not_configured' } });
    }
    try {
      const result = await sendMorningReminders();
      return res.json({ success: true, data: result });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro no cron';
      return res.status(500).json({ success: false, error: msg });
    }
  },
};
