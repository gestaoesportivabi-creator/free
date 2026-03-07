/**
 * Controller para Programações
 */

import { Request, Response } from 'express';
import { schedulesService } from '../services/schedules.service';
import { AppError } from '../utils/errors';
import { runWithTenant } from '../utils/transactionWithTenant';

function handleError(error: unknown, res: Response, fallback: string) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }
  return res.status(500).json({ success: false, error: error instanceof Error ? error.message : fallback });
}

export const schedulesController = {
  getAll: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const schedules = await runWithTenant(req, (tx) => schedulesService.getAll(req.tenantInfo!, tx));
      return res.json({ success: true, data: schedules });
    } catch (error) {
      return handleError(error, res, 'Erro ao buscar programações');
    }
  },

  getById: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const schedule = await runWithTenant(req, (tx) => schedulesService.getById(req.params.id, req.tenantInfo!, tx));
      return res.json({ success: true, data: schedule });
    } catch (error) {
      return handleError(error, res, 'Erro ao buscar programação');
    }
  },

  create: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const schedule = await runWithTenant(req, (tx) => schedulesService.create(req.body, req.tenantInfo!, tx));
      return res.status(201).json({ success: true, data: schedule });
    } catch (error) {
      return handleError(error, res, 'Erro ao criar programação');
    }
  },

  update: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const schedule = await runWithTenant(req, (tx) => schedulesService.update(req.params.id, req.body, req.tenantInfo!, tx));
      return res.json({ success: true, data: schedule });
    } catch (error) {
      return handleError(error, res, 'Erro ao atualizar programação');
    }
  },

  delete: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      await runWithTenant(req, (tx) => schedulesService.delete(req.params.id, req.tenantInfo!, tx));
      return res.json({ success: true });
    } catch (error) {
      return handleError(error, res, 'Erro ao deletar programação');
    }
  },
};

