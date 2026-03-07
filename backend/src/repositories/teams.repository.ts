/**
 * Repository para Equipes
 * Apenas acesso a dados - sem lógica de negócio
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';
import type { TransactionClient } from '../utils/transactionWithTenant';

function db(tx?: TransactionClient) {
  return tx ?? prisma;
}

// Tipos do banco (Prisma gera automaticamente, mas definimos aqui para referência)
type EquipeDB = {
  id: string;
  nome: string;
  categoria: string | null;
  temporada: string | null;
  tecnicoId: string;
  clubeId: string | null;
  createdAt: Date;
};

export const teamsRepository = {
  /**
   * Buscar todas as equipes do tenant
   */
  async findAll(tenantInfo: TenantInfo, tx?: TransactionClient): Promise<EquipeDB[]> {
    // DEBUG: Log do tenantInfo recebido
    console.log('[TEAMS_REPOSITORY] findAll - TenantInfo recebido:', {
      tecnico_id: tenantInfo.tecnico_id,
      clube_id: tenantInfo.clube_id,
      equipe_ids: tenantInfo.equipe_ids,
    });

    // Validação crítica: garantir que tenantInfo tenha pelo menos um ID
    if (!tenantInfo.tecnico_id && !tenantInfo.clube_id) {
      console.warn('[TEAMS_REPOSITORY] findAll - AVISO: Nenhum tenant_id encontrado, retornando array vazio');
      return [];
    }

    // Validação crítica: garantir que tecnico_id não seja string vazia
    if (tenantInfo.tecnico_id) {
      if (tenantInfo.tecnico_id.trim() === '') {
        console.error('[TEAMS_REPOSITORY] findAll - ERRO: tecnico_id é string vazia');
        return [];
      }
      console.log('[TEAMS_REPOSITORY] Filtrando equipes por tecnicoId:', tenantInfo.tecnico_id);
      
      // Validação crítica: garantir que tecnico_id não seja undefined ou null
      if (!tenantInfo.tecnico_id || typeof tenantInfo.tecnico_id !== 'string') {
        console.error('[TEAMS_REPOSITORY] findAll - ERRO CRÍTICO: tecnico_id inválido:', tenantInfo.tecnico_id);
        return [];
      }

      const equipes = await db(tx).equipe.findMany({
        where: { tecnicoId: tenantInfo.tecnico_id },
        orderBy: { nome: 'asc' },
      }) as EquipeDB[];
      
      console.log('[TEAMS_REPOSITORY] Equipes retornadas pelo Prisma (antes da validação):', equipes.map(e => ({ 
        id: e.id, 
        nome: e.nome, 
        tecnicoId: e.tecnicoId,
        tecnicoId_match: e.tecnicoId === tenantInfo.tecnico_id 
      })));
      
      // Validação adicional: garantir que todas as equipes retornadas pertencem ao técnico
      const equipesValidadas = equipes.filter(e => {
        const match = e.tecnicoId === tenantInfo.tecnico_id;
        if (!match) {
          console.error('[TEAMS_REPOSITORY] findAll - ERRO: Equipe não pertence ao técnico!', {
            equipe_id: e.id,
            equipe_nome: e.nome,
            equipe_tecnicoId: e.tecnicoId,
            tenant_tecnico_id: tenantInfo.tecnico_id,
            match: match,
          });
        }
        return match;
      });
      
      if (equipes.length !== equipesValidadas.length) {
        console.error('[TEAMS_REPOSITORY] findAll - ERRO CRÍTICO: Algumas equipes não pertencem ao técnico!', {
          total: equipes.length,
          validadas: equipesValidadas.length,
          filtradas: equipes.length - equipesValidadas.length,
        });
      }
      
      console.log('[TEAMS_REPOSITORY] Equipes validadas (retornadas):', equipesValidadas.map(e => ({ id: e.id, nome: e.nome, tecnicoId: e.tecnicoId })));
      return equipesValidadas;
    }

    // Validação crítica: garantir que clube_id não seja string vazia
    if (tenantInfo.clube_id) {
      if (tenantInfo.clube_id.trim() === '') {
        console.error('[TEAMS_REPOSITORY] findAll - ERRO: clube_id é string vazia');
        return [];
      }
      console.log('[TEAMS_REPOSITORY] Filtrando equipes por clubeId:', tenantInfo.clube_id);
      const equipes = await db(tx).equipe.findMany({
        where: { clubeId: tenantInfo.clube_id },
        orderBy: { nome: 'asc' },
      }) as EquipeDB[];
      
      // Validação adicional: garantir que todas as equipes retornadas pertencem ao clube
      const equipesValidadas = equipes.filter(e => e.clubeId === tenantInfo.clube_id);
      if (equipes.length !== equipesValidadas.length) {
        console.error('[TEAMS_REPOSITORY] findAll - ERRO CRÍTICO: Algumas equipes não pertencem ao clube!', {
          total: equipes.length,
          validadas: equipesValidadas.length,
        });
      }
      
      console.log('[TEAMS_REPOSITORY] Equipes encontradas:', equipesValidadas.map(e => ({ id: e.id, nome: e.nome, clubeId: e.clubeId })));
      return equipesValidadas;
    }

    // Se não tem tenant, retornar vazio
    console.log('[TEAMS_REPOSITORY] Nenhum tenant_id encontrado, retornando array vazio');
    return [];
  },

  /**
   * Buscar equipe por ID (com validação de tenant)
   */
  async findById(id: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<EquipeDB | null> {
    const equipe = await db(tx).equipe.findUnique({
      where: { id },
    });

    if (!equipe) {
      console.log('[TEAMS_REPOSITORY] findById - Equipe não encontrada no banco');
      return null;
    }

    console.log('[TEAMS_REPOSITORY] findById - Equipe encontrada:', {
      id: equipe.id,
      nome: equipe.nome,
      tecnicoId: equipe.tecnicoId,
      clubeId: equipe.clubeId,
    });

    // Verificar se equipe pertence ao tenant
    if (tenantInfo.tecnico_id && equipe.tecnicoId !== tenantInfo.tecnico_id) {
      console.log('[TEAMS_REPOSITORY] findById - ACESSO NEGADO: Equipe não pertence ao técnico', {
        equipe_tecnicoId: equipe.tecnicoId,
        tenant_tecnico_id: tenantInfo.tecnico_id,
      });
      return null;
    }

    if (tenantInfo.clube_id && equipe.clubeId !== tenantInfo.clube_id) {
      console.log('[TEAMS_REPOSITORY] findById - ACESSO NEGADO: Equipe não pertence ao clube', {
        equipe_clubeId: equipe.clubeId,
        tenant_clube_id: tenantInfo.clube_id,
      });
      return null;
    }

    // Se não tem tenant definido, não retornar
    if (!tenantInfo.tecnico_id && !tenantInfo.clube_id) {
      console.log('[TEAMS_REPOSITORY] findById - ACESSO NEGADO: Tenant não definido');
      return null;
    }

    console.log('[TEAMS_REPOSITORY] findById - Acesso permitido, retornando equipe');
    return equipe as EquipeDB;
  },

  /**
   * Criar nova equipe
   */
  async create(data: {
    nome: string;
    categoria?: string;
    temporada?: string;
    tecnicoId: string;
    clubeId?: string;
  }, tx?: TransactionClient): Promise<EquipeDB> {
    return db(tx).equipe.create({ data }) as Promise<EquipeDB>;
  },

  async update(id: string, data: Partial<EquipeDB>, tx?: TransactionClient): Promise<EquipeDB> {
    return db(tx).equipe.update({ where: { id }, data }) as Promise<EquipeDB>;
  },

  async delete(id: string, tx?: TransactionClient): Promise<boolean> {
    const equipe = await db(tx).equipe.findUnique({
      where: { id },
      include: { jogadores: true, jogos: true, programacoes: true, campeonatos: true },
    });
    if (!equipe) throw new Error('Equipe não encontrada');
    await db(tx).equipe.delete({ where: { id } });
    return true;
  },
};
