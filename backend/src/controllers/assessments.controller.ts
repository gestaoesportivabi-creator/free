/**
 * Controller para Avaliações Físicas
 */

import { Request, Response } from 'express';
import { assessmentsService } from '../services/assessments.service';
import { AppError } from '../utils/errors';

export const assessmentsController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const assessments = await assessmentsService.getAll(req.tenantInfo!);
      return res.json({ success: true, data: assessments });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar avaliações',
      });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const assessment = await assessmentsService.getById(req.params.id, req.tenantInfo!);
      return res.json({ success: true, data: assessment });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar avaliação',
      });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const assessment = await assessmentsService.create(req.body, req.tenantInfo!);
      return res.status(201).json({ success: true, data: assessment });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar avaliação',
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const assessment = await assessmentsService.update(req.params.id, req.body, req.tenantInfo!);
      return res.json({ success: true, data: assessment });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar avaliação',
      });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await assessmentsService.delete(req.params.id, req.tenantInfo!);
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
        error: 'Erro ao deletar avaliação',
      });
    }
  },
};

