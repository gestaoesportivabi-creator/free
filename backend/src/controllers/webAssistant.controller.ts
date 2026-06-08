/**
 * Web Assistant controller — JWT auth, tenant-scoped chat
 */

import { Request, Response } from 'express';
import {
  checkRateLimit,
  isHermesWebConfigured,
  streamChatToHermes,
  type ChatMessage,
} from '../services/webAssistant.service';

export const webAssistantController = {
  async status(req: Request, res: Response) {
    const user = req.user!;
    const tenant = req.tenantInfo;
    return res.json({
      success: true,
      data: {
        enabled: isHermesWebConfigured(),
        userName: user.name,
        role: user.role_id,
        userType: user.user_type ?? 'staff',
        equipeCount: tenant?.equipe_ids?.length ?? 0,
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
      .slice(-40)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }));

    if (sanitized.length === 0) {
      return res.status(400).json({ success: false, error: 'Nenhuma mensagem válida' });
    }

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
