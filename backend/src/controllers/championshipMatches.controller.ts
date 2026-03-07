/**
 * Controller para Jogos de Campeonato
 */

import { Request, Response } from 'express';
import { championshipMatchesService } from '../services/championshipMatches.service';
import { AppError } from '../utils/errors';

export const championshipMatchesController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const matches = await championshipMatchesService.getAll(req.tenantInfo!);
      return res.json({ success: true, data: matches });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar jogos de campeonato',
      });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const match = await championshipMatchesService.getById(req.params.id, req.tenantInfo!);
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
        error: 'Erro ao buscar jogo de campeonato',
      });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const match = await championshipMatchesService.create(req.body, req.tenantInfo!);
      return res.status(201).json({ success: true, data: match });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar jogo de campeonato',
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const match = await championshipMatchesService.update(req.params.id, req.body, req.tenantInfo!);
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
        error: 'Erro ao atualizar jogo de campeonato',
      });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await championshipMatchesService.delete(req.params.id, req.tenantInfo!);
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
        error: 'Erro ao deletar jogo de campeonato',
      });
    }
  },
};

