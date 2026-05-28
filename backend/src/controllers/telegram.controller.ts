/**
 * Webhook Telegram Bot API
 */

import { Request, Response } from 'express';
import { env } from '../config/env';
import { handleTelegramUpdate } from '../services/telegram/telegramBot.service';
import {
  deleteTelegramWebhook,
  isTelegramConfigured,
  setTelegramWebhook,
  TelegramUpdate,
} from '../services/telegram/telegramApi.client';
import { sendMorningReminders } from '../services/telegram/telegramReminders.service';

export const telegramController = {
  async webhook(req: Request, res: Response) {
    try {
      await handleTelegramUpdate(req.body as TelegramUpdate);
      return res.json({ ok: true });
    } catch (error) {
      console.error('[Telegram webhook]', error);
      return res.json({ ok: true });
    }
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
  async registerWebhook(req: Request, res: Response) {
    if (!isTelegramConfigured() || !env.TELEGRAM_WEBHOOK_SECRET) {
      return res.status(400).json({
        success: false,
        error: 'Configure TELEGRAM_BOT_TOKEN e TELEGRAM_WEBHOOK_SECRET',
      });
    }
    const base =
      (req.body?.url as string)?.replace(/\/$/, '') ||
      env.PUBLIC_API_URL.replace(/\/$/, '') ||
      `https://${req.get('host')}`;
    const webhookUrl = `${base}/api/telegram/webhook`;
    await setTelegramWebhook(webhookUrl, env.TELEGRAM_WEBHOOK_SECRET);
    return res.json({ success: true, data: { webhookUrl } });
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
