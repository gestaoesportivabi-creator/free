/**
 * Controller para Controle de Tempo Jogado
 */

import { Request, Response } from 'express';
import { timeControlsService } from '../services/timeControls.service';
import { AppError } from '../utils/errors';

export const timeControlsController = {
  /**
   * GET /api/time-controls?matchId=xxx
   * Buscar time controls por matchId
   */
  getByMatchId: async (req: Request, res: Response) => {
    try {
      const matchId = req.query.matchId as string;
      
      if (!matchId) {
        return res.status(400).json({
          success: false,
          error: 'matchId é obrigatório',
        });
      }

      const timeControls = await timeControlsService.getByMatchId(matchId, req.tenantInfo!);
      return res.json({ success: true, data: timeControls });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar time controls',
      });
    }
  },

  /**
   * POST /api/time-controls
   * Salvar time controls para um jogo
   */
  saveForMatch: async (req: Request, res: Response) => {
    try {
      const { matchId, timeControls } = req.body;
      
      if (!matchId || !timeControls) {
        return res.status(400).json({
          success: false,
          error: 'matchId e timeControls são obrigatórios',
        });
      }

      const saved = await timeControlsService.saveForMatch(matchId, timeControls, req.tenantInfo!);
      return res.json({ success: true, data: saved });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao salvar time controls',
      });
    }
  },
};

