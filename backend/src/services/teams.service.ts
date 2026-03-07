/**
 * Service para Equipes
 * Lógica de negócio e orquestração
 */

import { TenantInfo } from '../utils/tenant.helper';
import { teamsRepository } from '../repositories/teams.repository';
import { Team } from '../types/frontend';
import { NotFoundError } from '../utils/errors';

export const teamsService = {
  /**
   * Buscar todas as equipes do tenant
   */
  async getAll(tenantInfo: TenantInfo): Promise<Team[]> {
    // Validação de segurança: garantir que tenantInfo existe
    if (!tenantInfo) {
      console.error('[TEAMS_SERVICE] getAll - ERRO: tenantInfo não fornecido');
      throw new Error('Tenant info não fornecido');
    }

    // Validação de segurança: garantir que tem pelo menos um ID de tenant
    if (!tenantInfo.tecnico_id && !tenantInfo.clube_id) {
      console.warn('[TEAMS_SERVICE] getAll - AVISO: Nenhum tenant_id encontrado, retornando array vazio');
      return [];
    }

    const equipes = await teamsRepository.findAll(tenantInfo);
    
    // Validação adicional: garantir que todas as equipes retornadas pertencem ao tenant
    const equipesValidadas = equipes.filter(equipe => {
      if (tenantInfo.tecnico_id) {
        return equipe.tecnicoId === tenantInfo.tecnico_id;
      }
      if (tenantInfo.clube_id) {
        return equipe.clubeId === tenantInfo.clube_id;
      }
      return false;
    });

    if (equipes.length !== equipesValidadas.length) {
      console.error('[TEAMS_SERVICE] getAll - ERRO CRÍTICO: Algumas equipes não pertencem ao tenant!', {
        total: equipes.length,
        validadas: equipesValidadas.length,
        tenant_tecnico_id: tenantInfo.tecnico_id,
        tenant_clube_id: tenantInfo.clube_id,
      });
      // Retornar apenas as validadas para segurança
      return equipesValidadas.map(equipe => ({
        id: equipe.id,
        nome: equipe.nome,
        categoria: equipe.categoria || undefined,
        temporada: equipe.temporada || undefined,
        tecnicoId: equipe.tecnicoId,
        clubeId: equipe.clubeId || undefined,
        createdAt: equipe.createdAt.toISOString(),
      }));
    }
    
    // Transformar para formato frontend
    return equipes.map(equipe => ({
      id: equipe.id,
      nome: equipe.nome,
      categoria: equipe.categoria || undefined,
      temporada: equipe.temporada || undefined,
      tecnicoId: equipe.tecnicoId,
      clubeId: equipe.clubeId || undefined,
      createdAt: equipe.createdAt.toISOString(),
    }));
  },

  /**
   * Buscar equipe por ID
   */
  async getById(id: string, tenantInfo: TenantInfo): Promise<Team> {
    const equipe = await teamsRepository.findById(id, tenantInfo);
    
    if (!equipe) {
      throw new NotFoundError('Equipe', id);
    }

    return {
      id: equipe.id,
      nome: equipe.nome,
      categoria: equipe.categoria || undefined,
      temporada: equipe.temporada || undefined,
      tecnicoId: equipe.tecnicoId,
      clubeId: equipe.clubeId || undefined,
      createdAt: equipe.createdAt.toISOString(),
    };
  },

  /**
   * Criar nova equipe
   */
  async create(data: {
    nome: string;
    categoria?: string;
    temporada?: string;
  }, tenantInfo: TenantInfo): Promise<Team> {
    // Validação de segurança: garantir que tenantInfo existe
    if (!tenantInfo) {
      console.error('[TEAMS_SERVICE] create - ERRO: tenantInfo não fornecido');
      throw new Error('Tenant info não fornecido');
    }

    // Validar que tenant tem técnico ou clube
    if (!tenantInfo.tecnico_id && !tenantInfo.clube_id) {
      console.error('[TEAMS_SERVICE] create - ERRO: Nenhum tenant_id encontrado');
      throw new Error('É necessário ser um técnico ou clube para criar equipes');
    }

    // Validação crítica: garantir que tecnico_id não seja string vazia
    if (tenantInfo.tecnico_id && tenantInfo.tecnico_id.trim() === '') {
      console.error('[TEAMS_SERVICE] create - ERRO: tecnico_id é string vazia');
      throw new Error('Técnico ID inválido');
    }

    // Validação crítica: garantir que clube_id não seja string vazia
    if (tenantInfo.clube_id && tenantInfo.clube_id.trim() === '') {
      console.error('[TEAMS_SERVICE] create - ERRO: clube_id é string vazia');
      throw new Error('Clube ID inválido');
    }

    // Validar nome obrigatório
    if (!data.nome || data.nome.trim().length === 0) {
      throw new Error('Nome da equipe é obrigatório');
    }

    // Criar equipe usando tecnicoId ou clubeId do tenant
    const equipe = await teamsRepository.create({
      nome: data.nome.trim(),
      categoria: data.categoria?.trim() || undefined,
      temporada: data.temporada?.trim() || undefined,
      tecnicoId: tenantInfo.tecnico_id || '',
      clubeId: tenantInfo.clube_id || undefined,
    });

    // Validação pós-criação: garantir que a equipe criada pertence ao tenant
    if (tenantInfo.tecnico_id && equipe.tecnicoId !== tenantInfo.tecnico_id) {
      console.error('[TEAMS_SERVICE] create - ERRO CRÍTICO: Equipe criada não pertence ao técnico!', {
        equipe_tecnicoId: equipe.tecnicoId,
        tenant_tecnico_id: tenantInfo.tecnico_id,
      });
      throw new Error('Erro ao criar equipe: validação de tenant falhou');
    }

    if (tenantInfo.clube_id && equipe.clubeId !== tenantInfo.clube_id) {
      console.error('[TEAMS_SERVICE] create - ERRO CRÍTICO: Equipe criada não pertence ao clube!', {
        equipe_clubeId: equipe.clubeId,
        tenant_clube_id: tenantInfo.clube_id,
      });
      throw new Error('Erro ao criar equipe: validação de tenant falhou');
    }

    console.log('[TEAMS_SERVICE] create - Equipe criada com sucesso:', {
      id: equipe.id,
      nome: equipe.nome,
      tecnicoId: equipe.tecnicoId,
      clubeId: equipe.clubeId,
    });

    return {
      id: equipe.id,
      nome: equipe.nome,
      categoria: equipe.categoria || undefined,
      temporada: equipe.temporada || undefined,
      tecnicoId: equipe.tecnicoId,
      clubeId: equipe.clubeId || undefined,
      createdAt: equipe.createdAt.toISOString(),
    };
  },

  /**
   * Atualizar equipe
   */
  async update(id: string, data: Partial<{
    nome: string;
    categoria?: string;
    temporada?: string;
  }>, tenantInfo: TenantInfo): Promise<Team> {
    // Validação de segurança: garantir que tenantInfo existe
    if (!tenantInfo) {
      console.error('[TEAMS_SERVICE] update - ERRO: tenantInfo não fornecido');
      throw new Error('Tenant info não fornecido');
    }

    // Verificar se equipe existe e pertence ao tenant
    const existing = await teamsRepository.findById(id, tenantInfo);
    if (!existing) {
      console.error('[TEAMS_SERVICE] update - ERRO: Equipe não encontrada ou não pertence ao tenant', {
        equipe_id: id,
        tenant_tecnico_id: tenantInfo.tecnico_id,
        tenant_clube_id: tenantInfo.clube_id,
      });
      throw new NotFoundError('Equipe', id);
    }

    // Validação adicional: garantir que a equipe existente pertence ao tenant
    if (tenantInfo.tecnico_id && existing.tecnicoId !== tenantInfo.tecnico_id) {
      console.error('[TEAMS_SERVICE] update - ERRO CRÍTICO: Equipe não pertence ao técnico!', {
        equipe_tecnicoId: existing.tecnicoId,
        tenant_tecnico_id: tenantInfo.tecnico_id,
      });
      throw new NotFoundError('Equipe', id);
    }

    if (tenantInfo.clube_id && existing.clubeId !== tenantInfo.clube_id) {
      console.error('[TEAMS_SERVICE] update - ERRO CRÍTICO: Equipe não pertence ao clube!', {
        equipe_clubeId: existing.clubeId,
        tenant_clube_id: tenantInfo.clube_id,
      });
      throw new NotFoundError('Equipe', id);
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (data.nome !== undefined) {
      if (!data.nome || data.nome.trim().length === 0) {
        throw new Error('Nome da equipe não pode ser vazio');
      }
      updateData.nome = data.nome.trim();
    }
    if (data.categoria !== undefined) {
      updateData.categoria = data.categoria?.trim() || null;
    }
    if (data.temporada !== undefined) {
      updateData.temporada = data.temporada?.trim() || null;
    }

    // IMPORTANTE: Não permitir alteração de tecnicoId ou clubeId
    // Isso garante que a equipe sempre permaneça no mesmo tenant
    if (updateData.tecnicoId || updateData.clubeId) {
      console.error('[TEAMS_SERVICE] update - ERRO: Tentativa de alterar tecnicoId ou clubeId');
      throw new Error('Não é permitido alterar o técnico ou clube da equipe');
    }

    // Atualizar
    const equipe = await teamsRepository.update(id, updateData);

    // Validação pós-atualização: garantir que a equipe ainda pertence ao tenant
    if (tenantInfo.tecnico_id && equipe.tecnicoId !== tenantInfo.tecnico_id) {
      console.error('[TEAMS_SERVICE] update - ERRO CRÍTICO: Equipe atualizada não pertence ao técnico!');
      throw new Error('Erro ao atualizar equipe: validação de tenant falhou');
    }

    if (tenantInfo.clube_id && equipe.clubeId !== tenantInfo.clube_id) {
      console.error('[TEAMS_SERVICE] update - ERRO CRÍTICO: Equipe atualizada não pertence ao clube!');
      throw new Error('Erro ao atualizar equipe: validação de tenant falhou');
    }

    return {
      id: equipe.id,
      nome: equipe.nome,
      categoria: equipe.categoria || undefined,
      temporada: equipe.temporada || undefined,
      tecnicoId: equipe.tecnicoId,
      clubeId: equipe.clubeId || undefined,
      createdAt: equipe.createdAt.toISOString(),
    };
  },

  /**
   * Deletar equipe
   */
  async delete(id: string, tenantInfo: TenantInfo): Promise<boolean> {
    // Validação de segurança: garantir que tenantInfo existe
    if (!tenantInfo) {
      console.error('[TEAMS_SERVICE] delete - ERRO: tenantInfo não fornecido');
      throw new Error('Tenant info não fornecido');
    }

    // Verificar se equipe existe e pertence ao tenant
    const existing = await teamsRepository.findById(id, tenantInfo);
    if (!existing) {
      console.error('[TEAMS_SERVICE] delete - ERRO: Equipe não encontrada ou não pertence ao tenant', {
        equipe_id: id,
        tenant_tecnico_id: tenantInfo.tecnico_id,
        tenant_clube_id: tenantInfo.clube_id,
      });
      throw new NotFoundError('Equipe', id);
    }

    // Validação adicional: garantir que a equipe pertence ao tenant
    if (tenantInfo.tecnico_id && existing.tecnicoId !== tenantInfo.tecnico_id) {
      console.error('[TEAMS_SERVICE] delete - ERRO CRÍTICO: Equipe não pertence ao técnico!', {
        equipe_tecnicoId: existing.tecnicoId,
        tenant_tecnico_id: tenantInfo.tecnico_id,
      });
      throw new NotFoundError('Equipe', id);
    }

    if (tenantInfo.clube_id && existing.clubeId !== tenantInfo.clube_id) {
      console.error('[TEAMS_SERVICE] delete - ERRO CRÍTICO: Equipe não pertence ao clube!', {
        equipe_clubeId: existing.clubeId,
        tenant_clube_id: tenantInfo.clube_id,
      });
      throw new NotFoundError('Equipe', id);
    }

    await teamsRepository.delete(id);
    console.log('[TEAMS_SERVICE] delete - Equipe deletada com sucesso:', id);
    return true;
  },
};
