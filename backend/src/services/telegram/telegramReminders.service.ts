/**
 * Lembretes matinais via Telegram (cron)
 */

import prisma from '../../config/database';
import {
  countPendingTasks,
  formatTodaySummaryForTelegram,
  getAthleteTodaySummary,
} from '../athleteWellness.service';
import { sendTelegramMessage } from './telegramApi.client';
import { fillMenuKeyboard } from './telegramKeyboards';

export async function sendMorningReminders(): Promise<{ sent: number; skipped: number }> {
  const athletes = await prisma.user.findMany({
    where: {
      telegramChatId: { not: null },
      isActive: true,
      jogadorId: { not: null },
      role: { name: 'ATLETA' },
    },
    select: { telegramChatId: true, name: true, jogadorId: true },
  });

  let sent = 0;
  let skipped = 0;

  for (const a of athletes) {
    if (!a.telegramChatId || !a.jogadorId) {
      skipped++;
      continue;
    }
    const summary = await getAthleteTodaySummary(a.jogadorId);
    const pending = countPendingTasks(summary);
    if (pending === 0) {
      skipped++;
      continue;
    }

    const text = `☀️ Bom dia, ${a.name}!\n\n${formatTodaySummaryForTelegram(a.name, summary)}`;
    await sendTelegramMessage(a.telegramChatId, text, {
      reply_markup: fillMenuKeyboard(summary),
    });
    sent++;
  }

  return { sent, skipped };
}
