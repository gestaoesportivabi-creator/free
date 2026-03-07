/**
 * Controller para Equipes
 * Seguindo convenções: apenas recebe requisições e chama services
 */

import { Request, Response } from 'express';
import { teamsService } from '../services/teams.service';
import { AppError } from '../utils/errors';

export const teamsController = {
  /**
   * GET /api/teams
   */
  getAll: async (req: Request, res: Response) => {
    try {
      // DEBUG: Log do tenantInfo no controller
      console.log('[TEAMS_CONTROLLER] getAll - TenantInfo recebido:', {
        tecnico_id: req.tenantInfo?.tecnico_id,
        clube_id: req.tenantInfo?.clube_id,
        equipe_ids: req.tenantInfo?.equipe_ids,
        equipe_ids_count: req.tenantInfo?.equipe_ids?.length || 0,
        user_email: req.user?.email,
        user_id: req.user?.id,
      });

      if (!req.tenantInfo) {
        console.error('[TEAMS_CONTROLLER] getAll - ERRO: tenantInfo não está disponível');
        return res.status(500).json({
          success: false,
          error: 'Tenant info não disponível',
        });
      }

      const teams = await teamsService.getAll(req.tenantInfo);
      
      console.log('[TEAMS_CONTROLLER] getAll - Equipes retornadas:', {
        count: teams.length,
        teams: teams.map(t => ({ id: t.id, nome: t.nome, tecnicoId: t.tecnicoId })),
      });

      return res.json({ success: true, data: teams });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar equipes',
      });
    }
  },

  /**
   * GET /api/teams/:id
   */
  getById: async (req: Request, res: Response) => {
    try {
      // DEBUG: Log do tenantInfo no controller
      console.log('[TEAMS_CONTROLLER] getById - TenantInfo recebido:', {
        tecnico_id: req.tenantInfo?.tecnico_id,
        clube_id: req.tenantInfo?.clube_id,
        equipe_id: req.params.id,
        user_email: req.user?.email,
        user_id: req.user?.id,
      });

      if (!req.tenantInfo) {
        console.error('[TEAMS_CONTROLLER] getById - ERRO: tenantInfo não está disponível');
        return res.status(500).json({
          success: false,
          error: 'Tenant info não disponível',
        });
      }

      const team = await teamsService.getById(req.params.id, req.tenantInfo);
      
      // Validação final: garantir que a equipe retornada pertence ao tenant
      if (req.tenantInfo.tecnico_id && team.tecnicoId !== req.tenantInfo.tecnico_id) {
        console.error('[TEAMS_CONTROLLER] getById - ERRO CRÍTICO: Equipe não pertence ao técnico!', {
          equipe_tecnicoId: team.tecnicoId,
          tenant_tecnico_id: req.tenantInfo.tecnico_id,
        });
        return res.status(403).json({
          success: false,
          error: 'Acesso negado a esta equipe',
        });
      }

      if (req.tenantInfo.clube_id && team.clubeId !== req.tenantInfo.clube_id) {
        console.error('[TEAMS_CONTROLLER] getById - ERRO CRÍTICO: Equipe não pertence ao clube!', {
          equipe_clubeId: team.clubeId,
          tenant_clube_id: req.tenantInfo.clube_id,
        });
        return res.status(403).json({
          success: false,
          error: 'Acesso negado a esta equipe',
        });
      }

      return res.json({ success: true, data: team });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar equipe',
      });
    }
  },

  /**
   * POST /api/teams
   */
  create: async (req: Request, res: Response) => {
    try {
      // DEBUG: Log do tenantInfo no controller
      console.log('[TEAMS_CONTROLLER] create - TenantInfo recebido:', {
        tecnico_id: req.tenantInfo?.tecnico_id,
        clube_id: req.tenantInfo?.clube_id,
        user_email: req.user?.email,
        user_id: req.user?.id,
        body: req.body,
      });

      if (!req.tenantInfo) {
        console.error('[TEAMS_CONTROLLER] create - ERRO: tenantInfo não está disponível');
        return res.status(500).json({
          success: false,
          error: 'Tenant info não disponível',
        });
      }

      const team = await teamsService.create(req.body, req.tenantInfo);
      
      console.log('[TEAMS_CONTROLLER] create - Equipe criada:', {
        id: team.id,
        nome: team.nome,
        tecnicoId: team.tecnicoId,
      });

      return res.status(201).json({ success: true, data: team });
    } catch (error: any) {
      console.error('Erro ao criar equipe:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? error?.message || 'Erro ao criar equipe'
        : 'Erro ao criar equipe';
      return res.status(500).json({
        success: false,
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { details: error?.stack }),
      });
    }
  },

  /**
   * PUT /api/teams/:id
   */
  update: async (req: Request, res: Response) => {
    try {
      // DEBUG: Log do tenantInfo no controller
      console.log('[TEAMS_CONTROLLER] update - TenantInfo recebido:', {
        tecnico_id: req.tenantInfo?.tecnico_id,
        clube_id: req.tenantInfo?.clube_id,
        equipe_id: req.params.id,
        user_email: req.user?.email,
        user_id: req.user?.id,
        body: req.body,
      });

      if (!req.tenantInfo) {
        console.error('[TEAMS_CONTROLLER] update - ERRO: tenantInfo não está disponível');
        return res.status(500).json({
          success: false,
          error: 'Tenant info não disponível',
        });
      }

      // Validação: não permitir alteração de tecnicoId ou clubeId no body
      if (req.body.tecnicoId || req.body.clubeId) {
        console.error('[TEAMS_CONTROLLER] update - ERRO: Tentativa de alterar tecnicoId ou clubeId');
        return res.status(400).json({
          success: false,
          error: 'Não é permitido alterar o técnico ou clube da equipe',
        });
      }

      const team = await teamsService.update(req.params.id, req.body, req.tenantInfo);
      
      console.log('[TEAMS_CONTROLLER] update - Equipe atualizada:', {
        id: team.id,
        nome: team.nome,
        tecnicoId: team.tecnicoId,
      });

      return res.json({ success: true, data: team });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar equipe',
      });
    }
  },

  /**
   * DELETE /api/teams/:id
   */
  delete: async (req: Request, res: Response) => {
    try {
      // DEBUG: Log do tenantInfo no controller
      console.log('[TEAMS_CONTROLLER] delete - TenantInfo recebido:', {
        tecnico_id: req.tenantInfo?.tecnico_id,
        clube_id: req.tenantInfo?.clube_id,
        equipe_id: req.params.id,
        user_email: req.user?.email,
        user_id: req.user?.id,
      });

      if (!req.tenantInfo) {
        console.error('[TEAMS_CONTROLLER] delete - ERRO: tenantInfo não está disponível');
        return res.status(500).json({
          success: false,
          error: 'Tenant info não disponível',
        });
      }

      await teamsService.delete(req.params.id, req.tenantInfo);
      
      console.log('[TEAMS_CONTROLLER] delete - Equipe deletada:', req.params.id);

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
        error: 'Erro ao deletar equipe',
      });
    }
  },
};
