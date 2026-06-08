/**
 * Registra chamadas da Assistant API para o admin acompanhar atividade dos técnicos.
 */

import { Request, Response, NextFunction } from 'express';
import { logAssistantAudit } from '../utils/assistantAudit.helper';

function extractQuestion(req: Request): string | null {
  const body = req.body as { question?: string };
  if (body?.question?.trim()) return body.question.trim().slice(0, 2000);
  const q = req.query.question as string | undefined;
  if (q?.trim()) return q.trim().slice(0, 2000);
  return null;
}

export function logCoachAssistantActivity(req: Request, res: Response, next: NextFunction) {
  const chatId = (req as Request & { assistantChatId?: string }).assistantChatId;
  const user = req.user;
  const endpoint = req.path;
  const method = req.method;

  res.on('finish', () => {
    if (!chatId || res.statusCode >= 500) return;
    void logAssistantAudit({
      sessionKey: chatId,
      userId: user?.id ?? null,
      userName: user?.name ?? null,
      endpoint,
      method,
      question: extractQuestion(req),
      statusCode: res.statusCode,
    });
  });

  next();
}
