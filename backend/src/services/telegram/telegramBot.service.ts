/**
 * Bot Telegram Scout 21 — vincular, /hoje, preenchimento completo, lembretes
 */

import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import { normalizeAccessEmail } from '../../utils/athleteAccount.helper';
import {
  formatTodaySummaryForTelegram,
  getAthleteTodaySummary,
  saveBemEstarDiario,
  savePseJogo,
  savePseTreino,
  savePsrJogo,
  savePsrTreino,
  countPendingTasks,
} from '../athleteWellness.service';
import {
  answerCallbackQuery,
  sendTelegramMessage,
  TelegramUpdate,
} from './telegramApi.client';
import { cancelRow, fillMenuKeyboard, scaleKeyboard } from './telegramKeyboards';
import {
  clearSession,
  patchSessionPayload,
  setSession,
} from './telegramSession.service';

const WELLNESS_FIELDS = [
  { key: 'stress' as const, step: 'be:stress', label: 'Nível de stress (0-10)' },
  { key: 'sono' as const, step: 'be:sono', label: 'Qualidade do sono (0-10)' },
  { key: 'humor' as const, step: 'be:humor', label: 'Humor / motivação (0-10)' },
  { key: 'dor' as const, step: 'be:dor', label: 'Dor muscular (0-10)' },
  { key: 'satisfacao' as const, step: 'be:sat', label: 'Satisfação geral (0-10)' },
];

const HELP_TEXT = `Scout 21 Pro — Bot do atleta

/vincular email@x.com senha — ligar conta (senha do clube)
/hoje — status do dia
/preencher — abrir formulários pendentes
/ajuda — esta mensagem
/sair — desvincular Telegram`;

async function findUserByChatId(chatId: string) {
  return prisma.user.findFirst({
    where: { telegramChatId: chatId, isActive: true },
    include: { role: true },
  });
}

async function requireAthlete(chatId: string) {
  const user = await findUserByChatId(chatId);
  if (!user?.jogadorId) return null;
  return user;
}

async function linkTelegramAccount(chatId: string, email: string, password: string): Promise<string> {
  const normalizedEmail = normalizeAccessEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { role: true },
  });
  if (!user || !user.isActive) return '❌ Email ou senha incorretos.';
  if (user.role.name !== 'ATLETA' || !user.jogadorId) {
    return '❌ Conta não é de atleta. Use o email do cadastro do clube.';
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return '❌ Email ou senha incorretos.';

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { telegramChatId: chatId, NOT: { id: user.id } },
      data: { telegramChatId: null },
    }),
    prisma.user.update({ where: { id: user.id }, data: { telegramChatId: chatId } }),
  ]);

  return `✅ Conta vinculada, ${user.name}!\n\nUse /hoje ou /preencher para registrar fisiologia.`;
}

async function sendTodayStatus(chatId: string, userName: string, jogadorId: string) {
  const summary = await getAthleteTodaySummary(jogadorId);
  const text = formatTodaySummaryForTelegram(userName, summary);
  const pending = countPendingTasks(summary);
  await sendTelegramMessage(chatId, text, {
    reply_markup: pending > 0 ? fillMenuKeyboard(summary) : undefined,
  });
}

async function askWellnessField(chatId: string, fieldIndex: number) {
  const field = WELLNESS_FIELDS[fieldIndex];
  await setSession(chatId, field.step);
  const kb = scaleKeyboard(`be:${field.key}`);
  kb.inline_keyboard.push(cancelRow());
  await sendTelegramMessage(chatId, field.label, { reply_markup: kb });
}

async function handleWellnessValue(chatId: string, fieldKey: string, value: number) {
  const fieldIndex = WELLNESS_FIELDS.findIndex((f) => f.key === fieldKey);
  if (fieldIndex < 0) return;

  const merged = await patchSessionPayload(chatId, {
    wellness: { [fieldKey]: value },
  });

  const nextIndex = fieldIndex + 1;
  if (nextIndex < WELLNESS_FIELDS.length) {
    await askWellnessField(chatId, nextIndex);
    return;
  }

  const user = await requireAthlete(chatId);
  if (!user?.jogadorId) return;
  const summary = await getAthleteTodaySummary(user.jogadorId);
  if (!summary.equipeId) {
    await clearSession(chatId);
    await sendTelegramMessage(chatId, 'Sem equipe vinculada. Fale com a comissão.');
    return;
  }

  const w = merged.wellness || {};
  if (
    w.stress === undefined ||
    w.sono === undefined ||
    w.humor === undefined ||
    w.dor === undefined ||
    w.satisfacao === undefined
  ) {
    await sendTelegramMessage(chatId, 'Respostas incompletas. Use /preencher de novo.');
    await clearSession(chatId);
    return;
  }

  await saveBemEstarDiario(user.jogadorId, summary.equipeId, {
    stress: w.stress,
    sono: w.sono,
    humor: w.humor,
    dor: w.dor,
    satisfacao: w.satisfacao,
  });
  await clearSession(chatId);
  await sendTelegramMessage(chatId, '✅ Bem-estar de hoje registrado!');
  await sendTodayStatus(chatId, user.name, user.jogadorId);
}

async function handleScaleSave(
  chatId: string,
  kind: 'pse:t' | 'psr:t' | 'pse:j' | 'psr:j',
  value: number
) {
  const user = await requireAthlete(chatId);
  if (!user?.jogadorId) return;
  const summary = await getAthleteTodaySummary(user.jogadorId);

  if (kind === 'pse:t' || kind === 'psr:t') {
    if (!summary.equipeId) {
      await sendTelegramMessage(chatId, 'Sem equipe vinculada.');
      return;
    }
    if (kind === 'pse:t') await savePseTreino(user.jogadorId, summary.equipeId, value);
    else await savePsrTreino(user.jogadorId, summary.equipeId, value);
    await sendTelegramMessage(
      chatId,
      kind === 'pse:t' ? '✅ PSE treino registrado!' : '✅ PSR pós-treino registrado!'
    );
  } else {
    if (!summary.recentMatchId) {
      await sendTelegramMessage(chatId, 'Nenhum jogo recente para registrar.');
      return;
    }
    if (kind === 'pse:j') await savePseJogo(user.jogadorId, summary.recentMatchId, value);
    else await savePsrJogo(user.jogadorId, summary.recentMatchId, value);
    await sendTelegramMessage(
      chatId,
      kind === 'pse:j' ? '✅ PSE do jogo registrado!' : '✅ PSR do jogo registrado!'
    );
  }
  await clearSession(chatId);
  await sendTodayStatus(chatId, user.name, user.jogadorId);
}

async function handleCallback(callback: NonNullable<TelegramUpdate['callback_query']>) {
  const chatId = String(callback.message?.chat.id ?? callback.from.id);
  const data = callback.data || '';
  await answerCallbackQuery(callback.id);

  if (data === 'act:cancel') {
    await clearSession(chatId);
    await sendTelegramMessage(chatId, 'Cancelado.');
    return;
  }

  if (data === 'act:hoje') {
    const user = await requireAthlete(chatId);
    if (!user?.jogadorId) {
      await sendTelegramMessage(chatId, 'Vincule com /vincular email senha');
      return;
    }
    await sendTodayStatus(chatId, user.name, user.jogadorId);
    return;
  }

  const user = await requireAthlete(chatId);
  if (!user?.jogadorId) {
    await sendTelegramMessage(chatId, 'Vincule com /vincular email senha');
    return;
  }

  if (data === 'act:be') {
    await askWellnessField(chatId, 0);
    return;
  }
  if (data === 'act:pse:t') {
    await setSession(chatId, 'pse:t');
    const kb = scaleKeyboard('pse:t');
    kb.inline_keyboard.push(cancelRow());
    await sendTelegramMessage(chatId, 'PSE do treino (0 = repouso, 10 = máximo):', {
      reply_markup: kb,
    });
    return;
  }
  if (data === 'act:psr:t') {
    await setSession(chatId, 'psr:t');
    const kb = scaleKeyboard('psr:t');
    kb.inline_keyboard.push(cancelRow());
    await sendTelegramMessage(chatId, 'PSR pós-treino (0-10):', { reply_markup: kb });
    return;
  }
  if (data === 'act:pse:j' || data === 'act:psr:j') {
    const summary = await getAthleteTodaySummary(user.jogadorId);
    if (!summary.recentMatchId) {
      await sendTelegramMessage(chatId, 'Sem jogo recente.');
      return;
    }
    const prefix = data === 'act:pse:j' ? 'pse:j' : 'psr:j';
    await setSession(chatId, prefix, { jogoId: summary.recentMatchId });
    const kb = scaleKeyboard(prefix);
    kb.inline_keyboard.push(cancelRow());
    const label =
      data === 'act:pse:j'
        ? `PSE do jogo vs ${summary.recentMatchOpponent || 'adversário'}:`
        : `PSR do jogo vs ${summary.recentMatchOpponent || 'adversário'}:`;
    await sendTelegramMessage(chatId, label, { reply_markup: kb });
    return;
  }

  const beMatch = /^be:(stress|sono|humor|dor|satisfacao):(\d+)$/.exec(data);
  if (beMatch) {
    await handleWellnessValue(chatId, beMatch[1], parseInt(beMatch[2], 10));
    return;
  }

  const scaleMatch = /^(pse:t|psr:t|pse:j|psr:j):(\d+)$/.exec(data);
  if (scaleMatch) {
    await handleScaleSave(chatId, scaleMatch[1] as 'pse:t' | 'psr:t' | 'pse:j' | 'psr:j', parseInt(scaleMatch[2], 10));
  }
}

async function handleMessage(chatId: string, text: string) {
  if (text.startsWith('/start') || text === '/ajuda' || text === '/help') {
    const linked = await findUserByChatId(chatId);
    await sendTelegramMessage(
      chatId,
      linked ? `Olá, ${linked.name}! 👋\n\n${HELP_TEXT}` : `Olá! Scout 21 Pro.\n\n${HELP_TEXT}`
    );
    return;
  }

  if (text.startsWith('/vincular')) {
    const parts = text.split(/\s+/);
    if (parts.length < 3) {
      await sendTelegramMessage(chatId, 'Uso: /vincular email@exemplo.com sua_senha');
      return;
    }
    const reply = await linkTelegramAccount(chatId, parts[1], parts.slice(2).join(' '));
    await sendTelegramMessage(chatId, reply);
    return;
  }

  if (text.startsWith('/sair')) {
    const user = await findUserByChatId(chatId);
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { telegramChatId: null } });
      await clearSession(chatId);
    }
    await sendTelegramMessage(chatId, 'Conta desvinculada.');
    return;
  }

  const user = await requireAthlete(chatId);
  if (!user?.jogadorId) {
    if (text.startsWith('/hoje') || text.startsWith('/preencher')) {
      await sendTelegramMessage(chatId, 'Vincule primeiro: /vincular email@exemplo.com senha');
    } else if (!text.startsWith('/')) {
      await sendTelegramMessage(chatId, 'Use /vincular email senha ou /ajuda');
    } else {
      await sendTelegramMessage(chatId, 'Comando desconhecido. /ajuda');
    }
    return;
  }

  if (text.startsWith('/hoje') || text.startsWith('/preencher')) {
    const summary = await getAthleteTodaySummary(user.jogadorId);
    if (text.startsWith('/preencher')) {
      const pending = countPendingTasks(summary);
      if (pending === 0) {
        await sendTelegramMessage(chatId, '🎉 Nada pendente hoje!');
        return;
      }
      await sendTelegramMessage(chatId, 'Escolha o que preencher:', {
        reply_markup: fillMenuKeyboard(summary),
      });
      return;
    }
    await sendTodayStatus(chatId, user.name, user.jogadorId);
    return;
  }

  await sendTelegramMessage(chatId, 'Use /hoje, /preencher ou /ajuda');
}

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  try {
    if (update.callback_query) {
      await handleCallback(update.callback_query);
      return;
    }
    const message = update.message;
    if (message?.text) {
      await handleMessage(String(message.chat.id), message.text.trim());
    }
  } catch (error) {
    console.error('[Telegram bot]', error);
  }
}
