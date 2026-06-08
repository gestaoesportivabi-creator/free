/**
 * Platform admin controller — JWT ADMINISTRADOR only
 */

import { Request, Response } from 'express';
import {
  getAssistantActivity,
  getPlatformOverview,
  getPlatformUserDetail,
  getSystemHealth,
  getUserInsightsPack,
  listPlatformTenants,
} from '../services/platformAdmin.service';

export const platformAdminController = {
  async overview(_req: Request, res: Response) {
    const data = await getPlatformOverview();
    return res.json({ success: true, data });
  },

  async tenants(req: Request, res: Response) {
    const limit = Math.min(parseInt(String(req.query.limit || '100'), 10) || 100, 200);
    const data = await listPlatformTenants(limit);
    return res.json({ success: true, data });
  },

  async userDetail(req: Request, res: Response) {
    const data = await getPlatformUserDetail(req.params.userId);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }
    return res.json({ success: true, data });
  },

  async assistantActivity(req: Request, res: Response) {
    const source = req.query.source as 'web' | 'telegram' | 'all' | undefined;
    const data = await getAssistantActivity({
      limit: parseInt(String(req.query.limit || '50'), 10) || 50,
      userId: (req.query.userId as string | undefined)?.trim(),
      chatId: (req.query.chatId as string | undefined)?.trim(),
      source: source && source !== 'all' ? source : undefined,
    });
    return res.json({ success: true, data });
  },

  async userInsights(req: Request, res: Response) {
    const data = await getUserInsightsPack(req.params.userId);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado ou inativo' });
    }
    return res.json({ success: true, data });
  },

  async systemHealth(_req: Request, res: Response) {
    const data = await getSystemHealth();
    return res.json({ success: true, data });
  },
};
