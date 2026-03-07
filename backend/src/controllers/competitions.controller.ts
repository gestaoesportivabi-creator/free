/**
 * Controller para Competições
 */

import { Request, Response } from 'express';
import { competitionsService } from '../services/competitions.service';
import { AppError } from '../utils/errors';

export const competitionsController = {
  getAll: async (_req: Request, res: Response) => {
    try {
      const competitions = await competitionsService.getAll();
      return res.json({ success: true, data: competitions });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar competições',
      });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const competition = await competitionsService.getById(req.params.id);
      return res.json({ success: true, data: competition });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar competição',
      });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const competition = await competitionsService.create(req.body);
      return res.status(201).json({ success: true, data: competition });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar competição',
      });
    }
  },
};

