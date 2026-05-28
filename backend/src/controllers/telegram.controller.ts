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
} from '../services/telegram/telegramApi.client';

export const telegramController = {
  async webhook(req: Request, res: Response) {
    try {
      await handleTelegramUpdate(req.body);
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
};
