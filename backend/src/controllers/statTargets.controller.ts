/**
 * Controller para Metas de Estatísticas
 */

import { Request, Response } from 'express';
import { statTargetsService } from '../services/statTargets.service';
import { AppError } from '../utils/errors';

export const statTargetsController = {
  /**
   * GET /api/stat-targets
   * Retorna array para compatibilidade com frontend que chama getAll()
   */
  getAll: async (req: Request, res: Response) => {
    try {
      const targets = await statTargetsService.getAll(req.tenantInfo!);
      return res.json({ success: true, data: targets });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar metas',
      });
    }
  },

  /**
   * GET /api/stat-targets (alternativo - retorna objeto único)
   */
  get: async (req: Request, res: Response) => {
    try {
      const targets = await statTargetsService.get(req.tenantInfo!);
      return res.json({ success: true, data: targets });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar metas',
      });
    }
  },

  /**
   * PUT /api/stat-targets
   * Não precisa de ID - usa tenant para identificar
   */
  update: async (req: Request, res: Response) => {
    try {
      // Frontend pode enviar ID no body, mas não é necessário
      const { id, ...targetsData } = req.body;
      const targets = await statTargetsService.update(targetsData, req.tenantInfo!);
      return res.json({ success: true, data: targets });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar metas',
      });
    }
  },
};

