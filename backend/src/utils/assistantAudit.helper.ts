/**
 * Registro unificado de auditoria do assistente (Telegram, Hermes API e web dashboard).
 */

import prisma from '../config/database';

export function webSessionKey(userId: string): string {
  return `web:${userId}`;
}

export function isWebSessionKey(key: string): boolean {
  return key.startsWith('web:');
}

export async function logAssistantAudit(data: {
  sessionKey: string;
  userId?: string | null;
  userName?: string | null;
  endpoint: string;
  method: string;
  question?: string | null;
  statusCode: number;
}): Promise<void> {
  try {
    await prisma.coachAssistantAudit.create({
      data: {
        telegramChatId: data.sessionKey,
        userId: data.userId ?? null,
        userName: data.userName ?? null,
        endpoint: data.endpoint,
        method: data.method,
        question: data.question?.trim().slice(0, 2000) ?? null,
        statusCode: data.statusCode,
      },
    });
  } catch (err) {
    console.error('[assistantAudit]', err);
  }
}
