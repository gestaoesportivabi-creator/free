/**
 * Controller para Jogos de Campeonato
 */

import { Request, Response } from 'express';
import { championshipMatchesService } from '../services/championshipMatches.service';
import { AppError } from '../utils/errors';
import { runWithTenant } from '../utils/transactionWithTenant';

function handleError(error: unknown, res: Response, fallback: string) {
  if (error instanceof AppError) return res.status(error.statusCode).json({ success: false, error: error.message });
  return res.status(500).json({ success: false, error: error instanceof Error ? error.message : fallback });
}

export const championshipMatchesController = {
  getAll: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const matches = await runWithTenant(req, (tx) => championshipMatchesService.getAll(req.tenantInfo!, tx));
      return res.json({ success: true, data: matches });
    } catch (error) {
      return handleError(error, res, 'Erro ao buscar jogos de campeonato');
    }
  },

  getById: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const match = await runWithTenant(req, (tx) => championshipMatchesService.getById(req.params.id, req.tenantInfo!, tx));
      return res.json({ success: true, data: match });
    } catch (error) {
      return handleError(error, res, 'Erro ao buscar jogo de campeonato');
    }
  },

  create: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const match = await runWithTenant(req, (tx) => championshipMatchesService.create(req.body, req.tenantInfo!, tx));
      return res.status(201).json({ success: true, data: match });
    } catch (error) {
      return handleError(error, res, 'Erro ao criar jogo de campeonato');
    }
  },

  update: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const match = await runWithTenant(req, (tx) => championshipMatchesService.update(req.params.id, req.body, req.tenantInfo!, tx));
      return res.json({ success: true, data: match });
    } catch (error) {
      return handleError(error, res, 'Erro ao atualizar jogo de campeonato');
    }
  },

  delete: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      await runWithTenant(req, (tx) => championshipMatchesService.delete(req.params.id, req.tenantInfo!, tx));
      return res.json({ success: true });
    } catch (error) {
      return handleError(error, res, 'Erro ao deletar jogo de campeonato');
    }
  },
};
