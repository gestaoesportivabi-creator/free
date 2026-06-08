/**
 * Assistant API — consumida pelo Hermes (bot @scout21coachbot)
 */

import { Request, Response } from 'express';
import { env } from '../config/env';
import {
  getChatIdFromRequest,
  linkCoachTelegramAccount,
  linkCoachTelegramOpen,
  resolveCoachOrUserFromRequest,
  unlinkCoachTelegramAccount,
  validateAssistantServiceToken,
} from '../middleware/assistantAuth.middleware';
import { logCoachAssistantActivity } from '../middleware/assistantAudit.middleware';
import {
  getLastMatchSummary,
  getMatchHistory,
  getPendingWellnessPlayers,
  getPlayerStatus,
  getPreMatchBriefing,
  getQueryDataPack,
  getRosterStatus,
  getTeamReadiness,
  getWellnessEngagement,
} from '../services/insights/coachInsights.service';
import {
  addOpponentVideo,
  addYoutubeChannel,
  getOpponentDetailWithSeed,
  listOpponentsWithSeed,
  listVideoRegistry,
} from '../services/insights/coachOpponents.service';
import prisma from '../config/database';
import { getTenantInfo } from '../utils/tenant.helper';
import { loadCoachTenantByChatId } from '../utils/coachAdmin.helper';

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

  /** POST { chatId, userId } — vínculo sem senha (allowlist env) */
  async linkOpen(req: Request, res: Response) {
    const { chatId, userId } = req.body as { chatId?: string; userId?: string };
    if (!chatId?.trim() || !userId?.trim()) {
      return res.status(400).json({ success: false, error: 'chatId e userId são obrigatórios' });
    }
    const result = await linkCoachTelegramOpen(chatId.trim(), userId.trim());
    if (!result.ok) {
      return res.status(403).json({ success: false, error: result.message });
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

  async matches(req: Request, res: Response) {
    const raw = parseInt(String(req.query.limit || '50'), 10);
    const limit = Number.isFinite(raw) ? raw : 50;
    const data = await getMatchHistory(req.tenantInfo!, { limit });
    return res.json({ success: true, data });
  },

  async opponents(req: Request, res: Response) {
    const data = await listOpponentsWithSeed(req.tenantInfo!);
    return res.json({ success: true, data });
  },

  async opponentDetail(req: Request, res: Response) {
    const key = String(req.params.key || '').trim();
    if (!key) {
      return res.status(400).json({ success: false, error: 'Identificador do adversário obrigatório' });
    }
    const data = await getOpponentDetailWithSeed(req.tenantInfo!, key);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Adversário não encontrado' });
    }
    return res.json({ success: true, data });
  },

  async addOpponentVideo(req: Request, res: Response) {
    const key = String(req.params.key || '').trim();
    const { url, label, gameDate, opponentName } = req.body as {
      url?: string;
      label?: string;
      gameDate?: string;
      opponentName?: string;
    };
    if (!key || !url?.trim()) {
      return res.status(400).json({ success: false, error: 'key e url são obrigatórios' });
    }
    try {
      const data = await addOpponentVideo(req.tenantInfo!, key, {
        url: url.trim(),
        label,
        gameDate,
        opponentName,
        fonte: 'telegram',
      });
      return res.status(201).json({
        success: true,
        data: { message: 'Vídeo salvo com sucesso.', ...data },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar vídeo';
      return res.status(400).json({ success: false, error: message });
    }
  },

  async videoRegistry(req: Request, res: Response) {
    const data = await listVideoRegistry(req.tenantInfo!);
    return res.json({ success: true, data });
  },

  async addYoutubeChannel(req: Request, res: Response) {
    const { label, channelUrl, tipo } = req.body as {
      label?: string;
      channelUrl?: string;
      tipo?: string;
    };
    if (!channelUrl?.trim()) {
      return res.status(400).json({ success: false, error: 'channelUrl é obrigatório' });
    }
    try {
      const data = await addYoutubeChannel(req.tenantInfo!, {
        label: label?.trim() || 'Canal YouTube',
        channelUrl: channelUrl.trim(),
        tipo,
      });
      return res.status(data.created ? 201 : 200).json({
        success: true,
        data: {
          message: data.created ? 'Canal salvo.' : 'Canal já estava cadastrado.',
          channel: data.channel,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar canal';
      return res.status(400).json({ success: false, error: message });
    }
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

  /** GET — admin: técnicos vinculados ao bot Catanduvas */
  async adminCoaches(_req: Request, res: Response) {
    const linked = await prisma.user.findMany({
      where: { telegramCoachChatId: { not: null }, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        telegramCoachChatId: true,
        role: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, data: { coaches: linked } });
  },

  /** GET — admin: pacote completo de um técnico (Hermes central consulta o “bot filho”) */
  async adminCoachPack(req: Request, res: Response) {
    const chatId = String(req.params.chatId || '').trim();
    if (!chatId) {
      return res.status(400).json({ success: false, error: 'chatId obrigatório' });
    }
    const loaded = await loadCoachTenantByChatId(chatId);
    if (!loaded) {
      return res.status(404).json({
        success: false,
        error: 'Nenhum técnico vinculado a este chat_id',
      });
    }
    const { tenantInfo, userName, email } = loaded;
    const [briefing, readiness, lastMatch, matchHistory, roster, opponents] = await Promise.all([
      getPreMatchBriefing(tenantInfo),
      getTeamReadiness(tenantInfo),
      getLastMatchSummary(tenantInfo),
      getMatchHistory(tenantInfo),
      getRosterStatus(tenantInfo),
      listOpponentsWithSeed(tenantInfo),
    ]);
    return res.json({
      success: true,
      data: {
        chatId,
        userName,
        email,
        briefing,
        readiness,
        lastMatch,
        matchHistory,
        roster,
        opponents,
      },
    });
  },

  /** GET — admin: atividade recente da Assistant API */
  async adminActivity(req: Request, res: Response) {
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10) || 50, 200);
    const chatId = (req.query.chatId as string | undefined)?.trim();

    const rows = await prisma.coachAssistantAudit.findMany({
      where: chatId ? { telegramChatId: chatId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const linked = await prisma.user.findMany({
      where: { telegramCoachChatId: { not: null }, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        telegramCoachChatId: true,
      },
    });

    return res.json({
      success: true,
      data: {
        linkedCoaches: linked,
        activity: rows,
      },
    });
  },

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

export const assistantProtectedChain = [
  validateAssistantServiceToken,
  resolveCoachOrUserFromRequest,
  logCoachAssistantActivity,
];
