/**
 * Cliente HTTP da Telegram Bot API
 */

import { env } from '../../config/env';

const API_BASE = () => `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;

export function isTelegramConfigured(): boolean {
  return Boolean(env.TELEGRAM_BOT_TOKEN?.trim());
}

export async function telegramApi<T>(
  method: string,
  body?: Record<string, unknown>
): Promise<T> {
  if (!isTelegramConfigured()) {
    throw new Error('TELEGRAM_BOT_TOKEN não configurado');
  }
  const response = await fetch(`${API_BASE()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await response.json()) as { ok: boolean; description?: string; result?: T };
  if (!json.ok) {
    throw new Error(json.description || `Telegram API error: ${method}`);
  }
  return json.result as T;
}

export type TelegramReplyMarkup = {
  inline_keyboard: { text: string; callback_data: string }[][];
};

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  options?: { parse_mode?: 'Markdown' | 'HTML'; reply_markup?: TelegramReplyMarkup }
): Promise<void> {
  await telegramApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: options?.parse_mode,
    reply_markup: options?.reply_markup,
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  await telegramApi('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false,
  });
}

export async function setTelegramWebhook(webhookUrl: string, secretToken: string): Promise<void> {
  await telegramApi('setWebhook', {
    url: webhookUrl,
    secret_token: secretToken,
    allowed_updates: ['message', 'callback_query'],
  });
}

export async function deleteTelegramWebhook(): Promise<void> {
  await telegramApi('deleteWebhook', { drop_pending_updates: false });
}

export type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from?: { id: number; first_name?: string };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number };
    message?: { chat: { id: number } };
    data?: string;
  };
};

export async function getTelegramUpdates(
  offset: number,
  timeoutSeconds = 25
): Promise<TelegramUpdate[]> {
  return telegramApi<TelegramUpdate[]>('getUpdates', {
    offset,
    timeout: timeoutSeconds,
    allowed_updates: ['message', 'callback_query'],
  });
}
