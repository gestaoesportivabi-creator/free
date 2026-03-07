/**
 * Controller para Metas de Estatísticas
 */

import { Request, Response } from 'express';
import { statTargetsService } from '../services/statTargets.service';
import { AppError } from '../utils/errors';
import { runWithTenant } from '../utils/transactionWithTenant';

function handleError(error: unknown, res: Response, fallback: string) {
  if (error instanceof AppError) return res.status(error.statusCode).json({ success: false, error: error.message });
  return res.status(500).json({ success: false, error: error instanceof Error ? error.message : fallback });
}

export const statTargetsController = {
  getAll: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const targets = await runWithTenant(req, (tx) => statTargetsService.getAll(req.tenantInfo!, tx));
      return res.json({ success: true, data: targets });
    } catch (error) {
      return handleError(error, res, 'Erro ao buscar metas');
    }
  },

  get: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const targets = await runWithTenant(req, (tx) => statTargetsService.get(req.tenantInfo!, tx));
      return res.json({ success: true, data: targets });
    } catch (error) {
      return handleError(error, res, 'Erro ao buscar metas');
    }
  },

  update: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const { id, ...targetsData } = req.body;
      const targets = await runWithTenant(req, (tx) => statTargetsService.update(targetsData, req.tenantInfo!, tx));
      return res.json({ success: true, data: targets });
    } catch (error) {
      return handleError(error, res, 'Erro ao atualizar metas');
    }
  },
};
