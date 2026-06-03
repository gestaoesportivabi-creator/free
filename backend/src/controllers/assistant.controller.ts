/**
 * Assistant API — consumida pelo Hermes (bot @scout21coachbot)
 */

import { Request, Response } from 'express';
import { env } from '../config/env';
import {
  getChatIdFromRequest,
  linkCoachTelegramAccount,
  resolveCoachFromChat,
  unlinkCoachTelegramAccount,
  validateAssistantServiceToken,
} from '../middleware/assistantAuth.middleware';
import {
  getLastMatchSummary,
  getPendingWellnessPlayers,
  getPlayerStatus,
  getPreMatchBriefing,
  getQueryDataPack,
  getRosterStatus,
  getTeamReadiness,
  getWellnessEngagement,
} from '../services/insights/coachInsights.service';
import prisma from '../config/database';
import { getTenantInfo } from '../utils/tenant.helper';

async function loadTenantForUser(userId: string, roleName: string) {
  const user = { id: userId, role_id: roleName, email: '', name: '' };
  return getTenantInfo(
    user,
    async (uid) => {
      const t = await prisma.tecnico.findUnique({ where: { userId: uid } });
      return t ? { id: t.id, user_id: t.userId, nome: t.nome } : null;
    },
    async (uid) => {
      const c = await prisma.clube.findUnique({ where: { userId: uid } });
      return c ? { id: c.id, user_id: c.userId, razao_social: c.razaoSocial } : null;
    },
    async (tecnicoId) => prisma.equipe.findMany({ where: { tecnicoId }, select: { id: true } }),
    async (clubeId) => prisma.equipe.findMany({ where: { clubeId }, select: { id: true } })
  );
}

export const assistantController = {
  async status(_req: Request, res: Response) {
    return res.json({
      success: true,
      data: {
        configured: Boolean(env.ASSISTANT_SERVICE_TOKEN?.trim()),
        publicApiUrl: env.PUBLIC_API_URL || null,
      },
    });
  },

  /** POST { chatId, email, password } — Hermes chama ao /vincular */
  async link(req: Request, res: Response) {
    const { chatId, email, password } = req.body as {
      chatId?: string;
      email?: string;
      password?: string;
    };
    if (!chatId?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ success: false, error: 'chatId, email e password são obrigatórios' });
    }
    const result = await linkCoachTelegramAccount(chatId.trim(), email.trim(), password);
    if (!result.ok) {
      return res.status(401).json({ success: false, error: result.message });
    }
    return res.json({
      success: true,
      data: {
        message: `Conta vinculada, ${result.name}! ${result.equipeCount} equipe(s) ativa(s).`,
        name: result.name,
        equipeCount: result.equipeCount,
      },
    });
  },

  /** POST { chatId } */
  async unlink(req: Request, res: Response) {
    const chatId = getChatIdFromRequest(req);
    if (!chatId) {
      return res.status(400).json({ success: false, error: 'chatId obrigatório' });
    }
    await unlinkCoachTelegramAccount(chatId);
    return res.json({ success: true, data: { message: 'Telegram desvinculado.' } });
  },

  async briefing(req: Request, res: Response) {
    const data = await getPreMatchBriefing(req.tenantInfo!);
    return res.json({ success: true, data });
  },

  async readiness(req: Request, res: Response) {
    const data = await getTeamReadiness(req.tenantInfo!);
    return res.json({ success: true, data });
  },

  async rosterStatus(req: Request, res: Response) {
    const data = await getRosterStatus(req.tenantInfo!);
    return res.json({ success: true, data });
  },

  async lastMatch(req: Request, res: Response) {
    const data = await getLastMatchSummary(req.tenantInfo!);
    return res.json({ success: true, data });
  },

  async playerStatus(req: Request, res: Response) {
    const { id } = req.params;
    const data = await getPlayerStatus(req.tenantInfo!, id);
    return res.json({ success: true, data });
  },

  async wellnessEngagement(req: Request, res: Response) {
    const data = await getWellnessEngagement(req.tenantInfo!);
    return res.json({ success: true, data });
  },

  async pendingWellness(req: Request, res: Response) {
    const data = await getPendingWellnessPlayers(req.tenantInfo!);
    return res.json({ success: true, data });
  },

  /** POST — pacote consolidado para o Hermes resumir */
  async query(req: Request, res: Response) {
    const data = await getQueryDataPack(req.tenantInfo!);
    return res.json({ success: true, data });
  },

  /**
   * Cron: briefings para todos os técnicos vinculados (Hermes consome e envia no Telegram)
   * Authorization: Bearer CRON_SECRET
   */
  async cronBriefings(_req: Request, res: Response) {
    const linked = await prisma.user.findMany({
      where: {
        telegramCoachChatId: { not: null },
        isActive: true,
        role: { name: { in: ['ESSENCIAL', 'COMPETICAO', 'PERFORMANCE', 'ADMINISTRADOR'] } },
      },
      include: { role: true },
    });

    const briefings: {
      chatId: string;
      userName: string;
      briefing: Awaited<ReturnType<typeof getPreMatchBriefing>>;
    }[] = [];

    for (const user of linked) {
      if (!user.telegramCoachChatId) continue;
      try {
        const tenantInfo = await loadTenantForUser(user.id, user.role.name);
        if (!tenantInfo.equipe_ids?.length && user.role.name !== 'ADMINISTRADOR') continue;
        const briefing = await getPreMatchBriefing(tenantInfo);
        briefings.push({
          chatId: user.telegramCoachChatId,
          userName: user.name,
          briefing,
        });
      } catch (err) {
        console.error(`[assistant/cron/briefings] user ${user.id}:`, err);
      }
    }

    return res.json({
      success: true,
      data: { sent: briefings.length, briefings },
    });
  },
};

export const assistantProtectedChain = [validateAssistantServiceToken, resolveCoachFromChat];
