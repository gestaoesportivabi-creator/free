/**
 * Controller para Avaliações Físicas
 */

import { Request, Response } from 'express';
import { assessmentsService } from '../services/assessments.service';
import { AppError } from '../utils/errors';
import { runWithTenant } from '../utils/transactionWithTenant';

function handleError(error: unknown, res: Response, fallback: string) {
  if (error instanceof AppError) return res.status(error.statusCode).json({ success: false, error: error.message });
  return res.status(500).json({ success: false, error: error instanceof Error ? error.message : fallback });
}

export const assessmentsController = {
  getAll: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const assessments = await runWithTenant(req, (tx) => assessmentsService.getAll(req.tenantInfo!, tx));
      return res.json({ success: true, data: assessments });
    } catch (error) {
      return handleError(error, res, 'Erro ao buscar avaliações');
    }
  },

  getById: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const assessment = await runWithTenant(req, (tx) => assessmentsService.getById(req.params.id, req.tenantInfo!, tx));
      return res.json({ success: true, data: assessment });
    } catch (error) {
      return handleError(error, res, 'Erro ao buscar avaliação');
    }
  },

  create: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const assessment = await runWithTenant(req, (tx) => assessmentsService.create(req.body, req.tenantInfo!, tx));
      return res.status(201).json({ success: true, data: assessment });
    } catch (error) {
      return handleError(error, res, 'Erro ao criar avaliação');
    }
  },

  update: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const assessment = await runWithTenant(req, (tx) => assessmentsService.update(req.params.id, req.body, req.tenantInfo!, tx));
      return res.json({ success: true, data: assessment });
    } catch (error) {
      return handleError(error, res, 'Erro ao atualizar avaliação');
    }
  },

  delete: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      await runWithTenant(req, (tx) => assessmentsService.delete(req.params.id, req.tenantInfo!, tx));
      return res.json({ success: true });
    } catch (error) {
      return handleError(error, res, 'Erro ao deletar avaliação');
    }
  },
};

