/**
 * Autenticação da Assistant API (Hermes → Scout21)
 * Valida token de serviço + resolve técnico pelo telegramCoachChatId
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { env } from '../config/env';
import { getTenantInfo } from '../utils/tenant.helper';
import { normalizeAccessEmail } from '../utils/athleteAccount.helper';
import { STAFF_ROLES } from '../services/insights/coachInsights.service';
import { AppError } from '../utils/errors';

const SERVICE_TOKEN_HEADER = 'x-assistant-token';
const CHAT_ID_HEADER = 'x-telegram-chat-id';

export function validateAssistantServiceToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers[SERVICE_TOKEN_HEADER] as string | undefined;
  if (!env.ASSISTANT_SERVICE_TOKEN?.trim()) {
    return res.status(503).json({
      success: false,
      error: 'ASSISTANT_SERVICE_TOKEN não configurado no servidor',
    });
  }
  if (!token || token !== env.ASSISTANT_SERVICE_TOKEN) {
    return res.status(401).json({ success: false, error: 'Token de serviço inválido' });
  }
  next();
  return;
}

export function getChatIdFromRequest(req: Request): string | null {
  const header = req.headers[CHAT_ID_HEADER] as string | undefined;
  if (header?.trim()) return header.trim();
  const body = req.body as { chatId?: string };
  if (body?.chatId?.trim()) return body.chatId.trim();
  const query = req.query.chatId as string | undefined;
  if (query?.trim()) return query.trim();
  return null;
}

export async function resolveCoachFromChat(req: Request, res: Response, next: NextFunction) {
  try {
    const chatId = getChatIdFromRequest(req);
    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'chatId obrigatório (header X-Telegram-Chat-Id, body ou query)',
      });
    }

    const user = await prisma.user.findFirst({
      where: { telegramCoachChatId: chatId, isActive: true },
      include: { role: true },
    });

    if (!user) {
      return res.status(403).json({
        success: false,
        error: 'Chat não vinculado. Use /vincular email senha no bot do técnico.',
        code: 'NOT_LINKED',
      });
    }

    if (!STAFF_ROLES.has(user.role.name)) {
      return res.status(403).json({
        success: false,
        error: 'Conta vinculada não é de comissão técnica',
      });
    }

    req.user = {
      id: user.id,
      role_id: user.role.name,
      email: user.email,
      name: user.name,
      user_type: 'staff',
    };

    const tenantInfo = await getTenantInfo(
      req.user,
      async (userId) => {
        const t = await prisma.tecnico.findUnique({ where: { userId } });
        return t ? { id: t.id, user_id: t.userId, nome: t.nome } : null;
      },
      async (userId) => {
        const c = await prisma.clube.findUnique({ where: { userId } });
        return c ? { id: c.id, user_id: c.userId, razao_social: c.razaoSocial } : null;
      },
      async (tecnicoId) => prisma.equipe.findMany({ where: { tecnicoId }, select: { id: true } }),
      async (clubeId) => prisma.equipe.findMany({ where: { clubeId }, select: { id: true } })
    );

    if (!tenantInfo.tecnico_id && !tenantInfo.clube_id && user.role.name !== 'ADMINISTRADOR') {
      return res.status(403).json({
        success: false,
        error: 'Usuário sem técnico ou clube associado',
      });
    }

    req.tenantInfo = tenantInfo;
    (req as Request & { assistantChatId?: string }).assistantChatId = chatId;
    next();
    return;
  } catch (error) {
    console.error('[assistantAuth]', error);
    return res.status(500).json({ success: false, error: 'Erro ao resolver coach' });
  }
}

export async function linkCoachTelegramAccount(
  chatId: string,
  email: string,
  password: string
): Promise<{ ok: true; name: string; equipeCount: number } | { ok: false; message: string }> {
  const normalizedEmail = normalizeAccessEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    return { ok: false, message: 'Email ou senha incorretos.' };
  }

  if (!STAFF_ROLES.has(user.role.name)) {
    return { ok: false, message: 'Conta não é de comissão técnica. Use o email do cadastro do clube/técnico.' };
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { ok: false, message: 'Email ou senha incorretos.' };

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { telegramCoachChatId: chatId, NOT: { id: user.id } },
      data: { telegramCoachChatId: null },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { telegramCoachChatId: chatId },
    }),
  ]);

  const fakeUser = {
    id: user.id,
    role_id: user.role.name,
    email: user.email,
    name: user.name,
  };

  const tenantInfo = await getTenantInfo(
    fakeUser,
    async (userId) => {
      const t = await prisma.tecnico.findUnique({ where: { userId } });
      return t ? { id: t.id, user_id: t.userId, nome: t.nome } : null;
    },
    async (userId) => {
      const c = await prisma.clube.findUnique({ where: { userId } });
      return c ? { id: c.id, user_id: c.userId, razao_social: c.razaoSocial } : null;
    },
    async (tecnicoId) => prisma.equipe.findMany({ where: { tecnicoId }, select: { id: true } }),
    async (clubeId) => prisma.equipe.findMany({ where: { clubeId }, select: { id: true } })
  );

  return {
    ok: true,
    name: user.name,
    equipeCount: tenantInfo.equipe_ids?.length ?? 0,
  };
}

export async function unlinkCoachTelegramAccount(chatId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { telegramCoachChatId: chatId },
    data: { telegramCoachChatId: null },
  });
}

export function assertAssistantConfigured(): void {
  if (!env.ASSISTANT_SERVICE_TOKEN?.trim()) {
    throw new AppError('ASSISTANT_SERVICE_TOKEN não configurado', 503);
  }
}
