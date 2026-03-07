/**
 * Middleware de Multi-tenancy
 * Aplicar ajuste recomendado da Seção 11.2.B (item 12)
 * 
 * OBRIGATÓRIO: Todas as rotas que acessam dados devem usar este middleware
 * para garantir isolamento completo entre tenants (técnicos/clubes)
 */

import { Request, Response, NextFunction } from 'express';
import { getTenantInfo, TenantInfo } from '../utils/tenant.helper';

// Estender Request para incluir tenantInfo
declare global {
  namespace Express {
    interface Request {
      tenantInfo?: TenantInfo;
      user?: {
        id: string;
        role_id: string;
        email: string;
        name: string;
      };
    }
  }
}

/**
 * Middleware que adiciona tenantInfo ao request
 * Deve ser usado após autenticação (auth.middleware)
 */
import prisma from '../config/database';

export function tenantMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // IMPORTANTE: Limpar qualquer tenantInfo anterior para evitar cache
      req.tenantInfo = undefined;

      // Verificar se usuário está autenticado
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
        });
      }

      // DEBUG: Log do usuário autenticado
      console.log('[TENANT_MIDDLEWARE] ===== NOVA REQUISIÇÃO =====');
      console.log('[TENANT_MIDDLEWARE] Usuário autenticado:', {
        userId: req.user.id,
        email: req.user.email,
        role_id: req.user.role_id,
        timestamp: new Date().toISOString(),
      });

      // Obter informações do tenant usando Prisma
      const tenantInfo = await getTenantInfo(
        req.user,
        async (userId: string) => {
          console.log('[TENANT_MIDDLEWARE] Buscando técnico para userId:', userId);
          const tecnico = await prisma.tecnico.findUnique({ where: { userId } });
          if (!tecnico) {
            console.log('[TENANT_MIDDLEWARE] Técnico não encontrado para userId:', userId);
            return null;
          }
          console.log('[TENANT_MIDDLEWARE] Técnico encontrado:', {
            tecnico_id: tecnico.id,
            nome: tecnico.nome,
            userId: tecnico.userId,
          });
          return {
            id: tecnico.id,
            user_id: tecnico.userId,
            nome: tecnico.nome,
          };
        },
        async (userId: string) => {
          console.log('[TENANT_MIDDLEWARE] Buscando clube para userId:', userId);
          const clube = await prisma.clube.findUnique({ where: { userId } });
          if (!clube) {
            console.log('[TENANT_MIDDLEWARE] Clube não encontrado para userId:', userId);
            return null;
          }
          console.log('[TENANT_MIDDLEWARE] Clube encontrado:', {
            clube_id: clube.id,
            razao_social: clube.razaoSocial,
            userId: clube.userId,
          });
          return {
            id: clube.id,
            user_id: clube.userId,
            razao_social: clube.razaoSocial,
          };
        },
        async (tecnicoId: string) => {
          console.log('[TENANT_MIDDLEWARE] Buscando equipes para tecnicoId:', tecnicoId);
          const equipes = await prisma.equipe.findMany({
            where: { tecnicoId },
            select: { id: true },
          });
          console.log('[TENANT_MIDDLEWARE] Equipes encontradas:', equipes.map(e => e.id));
          return equipes;
        },
        async (clubeId: string) => {
          console.log('[TENANT_MIDDLEWARE] Buscando equipes para clubeId:', clubeId);
          const equipes = await prisma.equipe.findMany({
            where: { clubeId },
            select: { id: true },
          });
          console.log('[TENANT_MIDDLEWARE] Equipes encontradas:', equipes.map(e => e.id));
          return equipes;
        }
      );

      // DEBUG: Log do tenantInfo obtido
      console.log('[TENANT_MIDDLEWARE] TenantInfo obtido:', {
        tecnico_id: tenantInfo.tecnico_id,
        clube_id: tenantInfo.clube_id,
        equipe_ids: tenantInfo.equipe_ids,
        equipe_ids_count: tenantInfo.equipe_ids?.length || 0,
        user_email: req.user.email,
        user_id: req.user.id,
      });

      // Validação crítica: garantir que o tenantInfo corresponde ao usuário
      if (tenantInfo.tecnico_id) {
        // Verificar novamente que o técnico pertence ao usuário
        const tecnicoVerificado = await prisma.tecnico.findUnique({
          where: { userId: req.user.id },
        });
        if (!tecnicoVerificado || tecnicoVerificado.id !== tenantInfo.tecnico_id) {
          console.error('[TENANT_MIDDLEWARE] ERRO CRÍTICO: tenantInfo.tecnico_id não corresponde ao usuário!', {
            tenant_tecnico_id: tenantInfo.tecnico_id,
            tecnico_verificado_id: tecnicoVerificado?.id,
            user_id: req.user.id,
            user_email: req.user.email,
          });
          return res.status(500).json({
            success: false,
            error: 'Erro interno: Inconsistência no tenant',
          });
        }
      }

      // Verificar se usuário tem tenant associado
      if (!tenantInfo.tecnico_id && !tenantInfo.clube_id) {
        // Usuários ADMIN podem não ter tenant (acesso total)
        // Outros roles devem ter tenant
        const isAdmin = req.user.role_id === 'ADMIN'; // Ajustar conforme sua lógica de roles
        
        if (!isAdmin) {
          console.error('[TENANT_MIDDLEWARE] ERRO: Usuário não possui técnico ou clube associado:', {
            userId: req.user.id,
            email: req.user.email,
            role_id: req.user.role_id,
          });
          return res.status(403).json({
            success: false,
            error: 'Usuário não possui técnico ou clube associado',
          });
        }
      }

      // Validação crítica: garantir que tecnico_id não seja undefined ou null se o usuário é técnico
      if (req.user.role_id === 'TECNICO' && !tenantInfo.tecnico_id) {
        console.error('[TENANT_MIDDLEWARE] ERRO CRÍTICO: Usuário TECNICO sem tecnico_id:', {
          userId: req.user.id,
          email: req.user.email,
          role_id: req.user.role_id,
        });
        return res.status(500).json({
          success: false,
          error: 'Erro interno: Técnico não associado corretamente',
        });
      }

      // Validação crítica: garantir que clube_id não seja undefined ou null se o usuário é clube
      if (req.user.role_id === 'CLUBE' && !tenantInfo.clube_id) {
        console.error('[TENANT_MIDDLEWARE] ERRO CRÍTICO: Usuário CLUBE sem clube_id:', {
          userId: req.user.id,
          email: req.user.email,
          role_id: req.user.role_id,
        });
        return res.status(500).json({
          success: false,
          error: 'Erro interno: Clube não associado corretamente',
        });
      }

      // Adicionar tenantInfo ao request
      req.tenantInfo = tenantInfo;

      // DEBUG: Log final antes de prosseguir
      console.log('[TENANT_MIDDLEWARE] TenantInfo adicionado ao request:', {
        tecnico_id: req.tenantInfo?.tecnico_id,
        clube_id: req.tenantInfo?.clube_id,
        equipe_ids: req.tenantInfo?.equipe_ids,
      });

      next();
      return;
    } catch (error) {
      console.error('Erro no middleware de tenant:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar tenant',
      });
    }
  };
}

/**
 * Helper para validar acesso a uma equipe específica
 */
export function requireEquipeAccess(equipeId: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenantInfo) {
      return res.status(500).json({
        success: false,
        error: 'Tenant info não disponível',
      });
    }

    const hasAccess = req.tenantInfo.equipe_ids?.includes(equipeId) || false;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado a esta equipe',
      });
    }

    next();
    return;
  };
}

/**
 * Helper para validar acesso a um jogo específico (via equipe)
 */
export function requireJogoAccess(
  getEquipeIdByJogoId: (jogoId: string) => Promise<string | null>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const jogoId = req.params.id || req.body.jogo_id;

      if (!jogoId) {
        return res.status(400).json({
          success: false,
          error: 'ID do jogo não fornecido',
        });
      }

      if (!req.tenantInfo) {
        return res.status(500).json({
          success: false,
          error: 'Tenant info não disponível',
        });
      }

      const equipeId = await getEquipeIdByJogoId(jogoId);
      if (!equipeId) {
        return res.status(404).json({
          success: false,
          error: 'Jogo não encontrado',
        });
      }

      const hasAccess = req.tenantInfo.equipe_ids?.includes(equipeId) || false;

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado a este jogo',
        });
      }

      next();
      return;
    } catch (error) {
      console.error('Erro ao validar acesso ao jogo:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar acesso',
      });
    }
  };
}

/**
 * Documentação: Rotas que NÃO podem ser filtradas por tenant
 * 
 * Estas rotas devem ser explicitamente documentadas e protegidas por role ADMIN:
 * - GET /api/roles (lista de roles do sistema)
 * - GET /api/competicoes (competições globais - se aplicável)
 * - Rotas de administração do sistema
 * 
 * IMPORTANTE: Qualquer rota que não use tenantMiddleware deve ser documentada
 * e ter validação de role ADMIN.
 */

