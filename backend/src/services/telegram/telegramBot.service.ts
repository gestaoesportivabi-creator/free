/**
 * Comandos do bot Telegram Scout 21 (@scout21bot)
 */

import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import { normalizeAccessEmail } from '../../utils/athleteAccount.helper';
import {
  formatTodaySummaryForTelegram,
  getAthleteTodaySummary,
} from '../athleteWellness.service';
import { sendTelegramMessage } from './telegramApi.client';

async function findUserByChatId(chatId: string) {
  return prisma.user.findFirst({
    where: { telegramChatId: chatId, isActive: true },
    include: { role: true, jogador: true },
  });
}

async function linkTelegramAccount(chatId: string, email: string, password: string): Promise<string> {
  const normalizedEmail = normalizeAccessEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    return '❌ Email ou senha incorretos.';
  }
  if (user.role.name !== 'ATLETA' || !user.jogadorId) {
    return '❌ Esta conta não é de atleta. Use o email definido pelo clube no cadastro do jogador.';
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return '❌ Email ou senha incorretos.';
  }

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { telegramChatId: chatId, NOT: { id: user.id } },
      data: { telegramChatId: null },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { telegramChatId: chatId },
    }),
  ]);

  return `✅ Conta vinculada!\nOlá, ${user.name}.\n\nComandos:\n/hoje — o que falta preencher\n/ajuda — ajuda\n/sair — desvincular este Telegram`;
}

async function unlinkTelegram(chatId: string): Promise<string> {
  const user = await findUserByChatId(chatId);
  if (!user) {
    return 'Nenhuma conta vinculada neste chat.';
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { telegramChatId: null },
  });
  return 'Conta desvinculada. Até logo!';
}

const HELP_TEXT = `Scout 21 Pro — Bot do atleta

1️⃣ Vincule sua conta (uma vez):
/vincular seu@email.com sua_senha
(senha definida pelo clube)

2️⃣ Veja o dia:
/hoje

3️⃣ Preencha PSE/PSR/bem-estar no app web (por enquanto).

/sair — desvincular este Telegram`;

export async function handleTelegramUpdate(update: {
  message?: { chat: { id: number }; text?: string };
}): Promise<void> {
  const message = update.message;
  if (!message?.text) return;

  const chatId = String(message.chat.id);
  const text = message.text.trim();

  if (text.startsWith('/start') || text === '/ajuda' || text === '/help') {
    const linked = await findUserByChatId(chatId);
    if (linked) {
      await sendTelegramMessage(chatId, `Olá, ${linked.name}! 👋\n\n${HELP_TEXT}`);
    } else {
      await sendTelegramMessage(chatId, `Olá! Sou o bot do Scout 21 Pro.\n\n${HELP_TEXT}`);
    }
    return;
  }

  if (text.startsWith('/vincular')) {
    const parts = text.split(/\s+/);
    if (parts.length < 3) {
      await sendTelegramMessage(chatId, 'Uso: /vincular email@exemplo.com sua_senha');
      return;
    }
    const email = parts[1];
    const password = parts.slice(2).join(' ');
    const reply = await linkTelegramAccount(chatId, email, password);
    await sendTelegramMessage(chatId, reply);
    return;
  }

  if (text.startsWith('/sair')) {
    const reply = await unlinkTelegram(chatId);
    await sendTelegramMessage(chatId, reply);
    return;
  }

  if (text.startsWith('/hoje')) {
    const user = await findUserByChatId(chatId);
    if (!user?.jogadorId) {
      await sendTelegramMessage(
        chatId,
        'Conta não vinculada.\nUse: /vincular email@exemplo.com senha'
      );
      return;
    }
    const summary = await getAthleteTodaySummary(user.jogadorId);
    const body = formatTodaySummaryForTelegram(user.name, summary);
    await sendTelegramMessage(chatId, body);
    return;
  }

  await sendTelegramMessage(chatId, 'Comando não reconhecido. Use /ajuda');
}
