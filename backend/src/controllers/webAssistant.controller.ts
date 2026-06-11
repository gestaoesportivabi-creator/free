/**
 * Web Assistant controller — JWT auth, tenant-scoped chat
 */

import { Request, Response } from 'express';
import { getLastMatchSummary } from '../services/insights/coachInsights.service';
import { listVideoRegistry } from '../services/insights/coachOpponents.service';
import {
  checkRateLimit,
  isHermesWebConfigured,
  streamChatToHermes,
  type ChatMessage,
} from '../services/webAssistant.service';
import { logAssistantAudit, webSessionKey } from '../utils/assistantAudit.helper';

export const webAssistantController = {
  async status(req: Request, res: Response) {
    const user = req.user!;
    const tenant = req.tenantInfo!;
    const isStaff = (user.user_type ?? 'staff') !== 'athlete';

    let lastMatch: {
      opponent: string;
      date: string;
      result: string | null;
      videoUrl: string | null;
    } | null = null;
    let videoCount = 0;

    if (isStaff) {
      try {
        const [last, registry] = await Promise.all([
          getLastMatchSummary(tenant),
          listVideoRegistry(tenant),
        ]);
        if (last.match) {
          lastMatch = {
            opponent: last.match.opponent,
            date: last.match.date,
            result: last.match.result,
            videoUrl: last.match.videoUrl,
          };
        }
        videoCount = registry.total;
      } catch {
        /* status parcial ok */
      }
    }

    return res.json({
      success: true,
      data: {
        userId: user.id,
        enabled: isHermesWebConfigured(),
        userName: user.name,
        role: user.role_id,
        userType: user.user_type ?? 'staff',
        equipeCount: tenant?.equipe_ids?.length ?? 0,
        youtubeScoutEnabled: isStaff,
        lastMatch,
        videoCount,
      },
    });
  },

  async chatStream(req: Request, res: Response) {
    const user = req.user!;
    const tenant = req.tenantInfo!;

    if (!isHermesWebConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Assistente web não configurado. Contate o administrador.',
      });
    }

    if (!checkRateLimit(user.id)) {
      return res.status(429).json({
        success: false,
        error: 'Muitas mensagens em pouco tempo. Aguarde um minuto.',
      });
    }

    const { messages } = req.body as { messages?: ChatMessage[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'messages é obrigatório' });
    }

    const sanitized: ChatMessage[] = messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }));

    if (sanitized.length === 0) {
      return res.status(400).json({ success: false, error: 'Nenhuma mensagem válida' });
    }

    const lastUserMsg = [...sanitized].reverse().find((m) => m.role === 'user')?.content ?? null;

    res.on('finish', () => {
      if (res.statusCode >= 500) return;
      void logAssistantAudit({
        sessionKey: webSessionKey(user.id),
        userId: user.id,
        userName: user.name,
        endpoint: '/web-assistant/chat/stream',
        method: 'POST',
        question: lastUserMsg,
        statusCode: res.statusCode,
      });
    });

    await streamChatToHermes(
      {
        userId: user.id,
        role: user.role_id,
        name: user.name,
        tenantInfo: tenant,
        messages: sanitized,
      },
      res
    );
    return undefined;
  },
};
