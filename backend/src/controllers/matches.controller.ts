/**
 * Controller para Jogos/Matches
 */

import { Request, Response } from 'express';
import { matchesService } from '../services/matches.service';
import { AppError } from '../utils/errors';
import { runWithTenant } from '../utils/transactionWithTenant';

function handleError(error: unknown, res: Response, fallback: string) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }
  return res.status(500).json({
    success: false,
    error: error instanceof Error ? error.message : fallback,
  });
}

export const matchesController = {
  getAll: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const matches = await runWithTenant(req, (tx) => matchesService.getAll(req.tenantInfo!, tx));
      return res.json({ success: true, data: matches });
    } catch (error) {
      return handleError(error, res, 'Erro ao buscar jogos');
    }
  },

  getById: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const match = await runWithTenant(req, (tx) => matchesService.getById(req.params.id, req.tenantInfo!, tx));
      return res.json({ success: true, data: match });
    } catch (error) {
      return handleError(error, res, 'Erro ao buscar jogo');
    }
  },

  create: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const match = await runWithTenant(req, (tx) => matchesService.create(req.body, req.tenantInfo!, tx));
      return res.status(201).json({ success: true, data: match });
    } catch (error) {
      return handleError(error, res, 'Erro ao criar jogo');
    }
  },

  update: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const match = await runWithTenant(req, (tx) => matchesService.update(req.params.id, req.body, req.tenantInfo!, tx));
      return res.json({ success: true, data: match });
    } catch (error) {
      return handleError(error, res, 'Erro ao atualizar jogo');
    }
  },

  delete: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      await runWithTenant(req, (tx) => matchesService.delete(req.params.id, req.tenantInfo!, tx));
      return res.json({ success: true });
    } catch (error) {
      return handleError(error, res, 'Erro ao deletar jogo');
    }
  },
};

