/**
 * Controller para Controle de Tempo Jogado
 */

import { Request, Response } from 'express';
import { timeControlsService } from '../services/timeControls.service';
import { AppError } from '../utils/errors';
import { runWithTenant } from '../utils/transactionWithTenant';

function handleError(error: unknown, res: Response, fallback: string) {
  if (error instanceof AppError) return res.status(error.statusCode).json({ success: false, error: error.message });
  return res.status(500).json({ success: false, error: error instanceof Error ? error.message : fallback });
}

export const timeControlsController = {
  getByMatchId: async (req: Request, res: Response) => {
    const matchId = req.query.matchId as string;
    if (!matchId) return res.status(400).json({ success: false, error: 'matchId é obrigatório' });
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const timeControls = await runWithTenant(req, (tx) => timeControlsService.getByMatchId(matchId, req.tenantInfo!, tx));
      return res.json({ success: true, data: timeControls });
    } catch (error) {
      return handleError(error, res, 'Erro ao buscar time controls');
    }
  },

  saveForMatch: async (req: Request, res: Response) => {
    const { matchId, timeControls } = req.body;
    if (!matchId || !timeControls) return res.status(400).json({ success: false, error: 'matchId e timeControls são obrigatórios' });
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const saved = await runWithTenant(req, (tx) => timeControlsService.saveForMatch(matchId, timeControls, req.tenantInfo!, tx));
      return res.json({ success: true, data: saved });
    } catch (error) {
      return handleError(error, res, 'Erro ao salvar time controls');
    }
  },
};
