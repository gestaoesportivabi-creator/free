/**
 * Controller para Jogadores
 * Seguindo convenções: apenas recebe requisições e chama services
 */

import { Request, Response } from 'express';
import { playersService } from '../services/players.service';
import { AppError } from '../utils/errors';
import { runWithTenant } from '../utils/transactionWithTenant';

function handleError(error: unknown, res: Response, fallbackMessage: string) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }
  return res.status(500).json({
    success: false,
    error: error instanceof Error ? error.message : fallbackMessage,
  });
}

export const playersController = {
  getAll: async (req: Request, res: Response) => {
    if (!req.tenantInfo) {
      return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    }
    try {
      const players = await runWithTenant(req, (tx) => playersService.getAll(req.tenantInfo!, tx));
      const equipeIds = req.tenantInfo.equipe_ids ?? [];
      let reason: string | undefined;
      if (equipeIds.length === 0) reason = 'no_teams';
      else if (players.length === 0) reason = 'no_players_linked';
      return res.json({ success: true, data: players, ...(reason && { reason }) });
    } catch (error) {
      return handleError(error, res, 'Erro ao buscar jogadores');
    }
  },

  getById: async (req: Request, res: Response) => {
    if (!req.tenantInfo) {
      return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    }
    try {
      const player = await runWithTenant(req, (tx) => playersService.getById(req.params.id, req.tenantInfo!, tx));
      return res.json({ success: true, data: player });
    } catch (error) {
      return handleError(error, res, 'Erro ao buscar jogador');
    }
  },

  create: async (req: Request, res: Response) => {
    if (!req.tenantInfo) {
      return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    }
    try {
      const player = await runWithTenant(req, (tx) => playersService.create(req.body, req.tenantInfo!, tx));
      return res.status(201).json({ success: true, data: player });
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, error: error.message });
      }
      return res.status(500).json({
        success: false,
        error: error?.message || 'Erro ao criar jogador',
        ...(process.env.NODE_ENV === 'development' && { details: error?.stack }),
      });
    }
  },

  update: async (req: Request, res: Response) => {
    if (!req.tenantInfo) {
      return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    }
    try {
      const player = await runWithTenant(req, (tx) => playersService.update(req.params.id, req.body, req.tenantInfo!, tx));
      return res.json({ success: true, data: player });
    } catch (error) {
      return handleError(error, res, 'Erro ao atualizar jogador');
    }
  },

  delete: async (req: Request, res: Response) => {
    if (!req.tenantInfo) {
      return res.status(500).json({ success: false, error: 'Tenant info não disponível' });
    }
    try {
      await runWithTenant(req, (tx) => playersService.delete(req.params.id, req.tenantInfo!, tx));
      return res.json({ success: true });
    } catch (error) {
      return handleError(error, res, 'Erro ao deletar jogador');
    }
  },
};

