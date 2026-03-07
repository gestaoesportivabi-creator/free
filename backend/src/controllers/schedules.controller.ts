/**
 * Controller para Programações
 */

import { Request, Response } from 'express';
import { schedulesService } from '../services/schedules.service';
import { AppError } from '../utils/errors';

export const schedulesController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const schedules = await schedulesService.getAll(req.tenantInfo!);
      return res.json({ success: true, data: schedules });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar programações',
      });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const schedule = await schedulesService.getById(req.params.id, req.tenantInfo!);
      return res.json({ success: true, data: schedule });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar programação',
      });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const schedule = await schedulesService.create(req.body, req.tenantInfo!);
      return res.status(201).json({ success: true, data: schedule });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar programação',
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const schedule = await schedulesService.update(req.params.id, req.body, req.tenantInfo!);
      return res.json({ success: true, data: schedule });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar programação',
      });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await schedulesService.delete(req.params.id, req.tenantInfo!);
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
        error: 'Erro ao deletar programação',
      });
    }
  },
};

