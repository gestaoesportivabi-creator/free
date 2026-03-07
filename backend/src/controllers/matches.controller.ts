/**
 * Controller para Jogos/Matches
 */

import { Request, Response } from 'express';
import { matchesService } from '../services/matches.service';
import { AppError } from '../utils/errors';

export const matchesController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const matches = await matchesService.getAll(req.tenantInfo!);
      return res.json({ success: true, data: matches });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      console.error('[MATCHES_CONTROLLER] getAll error', error);
      if (error instanceof Error && error.stack) {
        console.error('[MATCHES_CONTROLLER] getAll stack', error.stack);
      }
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar jogos',
      });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const match = await matchesService.getById(req.params.id, req.tenantInfo!);
      return res.json({ success: true, data: match });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar jogo',
      });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const match = await matchesService.create(req.body, req.tenantInfo!);
      return res.status(201).json({ success: true, data: match });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      const message = error instanceof Error ? error.message : 'Erro ao criar jogo';
      console.error('[matches.controller] create error:', error);
      return res.status(500).json({
        success: false,
        error: message,
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const match = await matchesService.update(req.params.id, req.body, req.tenantInfo!);
      return res.json({ success: true, data: match });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar jogo',
      });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await matchesService.delete(req.params.id, req.tenantInfo!);
      return res.json({ success: true });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao deletar jogo',
      });
    }
  },
};

