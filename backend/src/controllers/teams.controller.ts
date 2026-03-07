/**
 * Controller para Equipes
 */

import { Request, Response } from 'express';
import { teamsService } from '../services/teams.service';
import { AppError } from '../utils/errors';
import { runWithTenant } from '../utils/transactionWithTenant';

function handleError(error: unknown, res: Response, fallback: string) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }
  return res.status(500).json({ success: false, error: error instanceof Error ? error.message : fallback });
}

export const teamsController = {
  getAll: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const teams = await runWithTenant(req, (tx) => teamsService.getAll(req.tenantInfo!, tx));
      return res.json({ success: true, data: teams });
    } catch (error) {
      return handleError(error, res, 'Erro ao buscar equipes');
    }
  },

  getById: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      const team = await runWithTenant(req, (tx) => teamsService.getById(req.params.id, req.tenantInfo!, tx));
      if (req.tenantInfo.tecnico_id && team.tecnicoId !== req.tenantInfo.tecnico_id) {
        return res.status(403).json({ success: false, error: 'Acesso negado a esta equipe' });
      }
      if (req.tenantInfo.clube_id && team.clubeId !== req.tenantInfo.clube_id) {
        return res.status(403).json({ success: false, error: 'Acesso negado a esta equipe' });
      }
      return res.json({ success: true, data: team });
    } catch (error) {
      return handleError(error, res, 'Erro ao buscar equipe');
    }
  },

  create: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    if (req.body.tecnicoId || req.body.clubeId) {
      return res.status(400).json({ success: false, error: 'Não é permitido enviar tecnicoId ou clubeId' });
    }
    try {
      const team = await runWithTenant(req, (tx) => teamsService.create(req.body, req.tenantInfo!, tx));
      return res.status(201).json({ success: true, data: team });
    } catch (error: any) {
      if (error instanceof AppError) return res.status(error.statusCode).json({ success: false, error: error.message });
      return res.status(500).json({
        success: false,
        error: error?.message || 'Erro ao criar equipe',
        ...(process.env.NODE_ENV === 'development' && { details: error?.stack }),
      });
    }
  },

  update: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    if (req.body.tecnicoId || req.body.clubeId) {
      return res.status(400).json({ success: false, error: 'Não é permitido alterar o técnico ou clube da equipe' });
    }
    try {
      const team = await runWithTenant(req, (tx) => teamsService.update(req.params.id, req.body, req.tenantInfo!, tx));
      return res.json({ success: true, data: team });
    } catch (error) {
      return handleError(error, res, 'Erro ao atualizar equipe');
    }
  },

  delete: async (req: Request, res: Response) => {
    if (!req.tenantInfo) return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    try {
      await runWithTenant(req, (tx) => teamsService.delete(req.params.id, req.tenantInfo!, tx));
      return res.json({ success: true });
    } catch (error) {
      return handleError(error, res, 'Erro ao deletar equipe');
    }
  },
};
