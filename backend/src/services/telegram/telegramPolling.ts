/**
 * Long polling para desenvolvimento local (sem HTTPS público)
 */

import { env } from '../../config/env';
import { getTelegramUpdates, isTelegramConfigured, TelegramUpdate } from './telegramApi.client';
import { handleTelegramUpdate } from './telegramBot.service';

let offset = 0;
let running = false;

export function startTelegramPolling(): void {
  if (!env.TELEGRAM_POLLING || !isTelegramConfigured() || running) return;
  running = true;
  console.log('🤖 Telegram: long polling ativo (TELEGRAM_POLLING=true)');

  const loop = async () => {
    while (running) {
      try {
        const updates = await getTelegramUpdates(offset);
        for (const update of updates as TelegramUpdate[]) {
          offset = update.update_id + 1;
          await handleTelegramUpdate(update);
        }
      } catch (error) {
        console.error('[Telegram polling]', error);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  };

  void loop();
}
