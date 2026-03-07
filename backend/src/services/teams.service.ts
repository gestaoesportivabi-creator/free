/**
 * Service para Equipes
 * Lógica de negócio e orquestração
 */

import { TenantInfo } from '../utils/tenant.helper';
import type { TransactionClient } from '../utils/transactionWithTenant';
import { teamsRepository } from '../repositories/teams.repository';
import { Team } from '../types/frontend';
import { NotFoundError } from '../utils/errors';

export const teamsService = {
  async getAll(tenantInfo: TenantInfo, tx?: TransactionClient): Promise<Team[]> {
    if (!tenantInfo) throw new Error('Tenant info não fornecido');
    if (!tenantInfo.tecnico_id && !tenantInfo.clube_id) return [];

    const equipes = await teamsRepository.findAll(tenantInfo, tx);
    
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

  async getById(id: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<Team> {
    const equipe = await teamsRepository.findById(id, tenantInfo, tx);
    if (!equipe) throw new NotFoundError('Equipe', id);

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
  }, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<Team> {
    if (!tenantInfo) throw new Error('Tenant info não fornecido');
    if (!tenantInfo.tecnico_id && !tenantInfo.clube_id) throw new Error('É necessário ser um técnico ou clube para criar equipes');
    if (tenantInfo.tecnico_id && tenantInfo.tecnico_id.trim() === '') throw new Error('Técnico ID inválido');
    if (tenantInfo.clube_id && tenantInfo.clube_id.trim() === '') throw new Error('Clube ID inválido');
    if (!data.nome || data.nome.trim().length === 0) throw new Error('Nome da equipe é obrigatório');

    const equipe = await teamsRepository.create({
      nome: data.nome.trim(),
      categoria: data.categoria?.trim() || undefined,
      temporada: data.temporada?.trim() || undefined,
      tecnicoId: tenantInfo.tecnico_id || '',
      clubeId: tenantInfo.clube_id || undefined,
    }, tx);

    if (tenantInfo.tecnico_id && equipe.tecnicoId !== tenantInfo.tecnico_id) throw new Error('Erro ao criar equipe: validação de tenant falhou');
    if (tenantInfo.clube_id && equipe.clubeId !== tenantInfo.clube_id) throw new Error('Erro ao criar equipe: validação de tenant falhou');

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
  }>, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<Team> {
    if (!tenantInfo) throw new Error('Tenant info não fornecido');
    const existing = await teamsRepository.findById(id, tenantInfo, tx);
    if (!existing) throw new NotFoundError('Equipe', id);
    if (tenantInfo.tecnico_id && existing.tecnicoId !== tenantInfo.tecnico_id) throw new NotFoundError('Equipe', id);
    if (tenantInfo.clube_id && existing.clubeId !== tenantInfo.clube_id) throw new NotFoundError('Equipe', id);

    const updateData: any = {};
    if (data.nome !== undefined) {
      if (!data.nome || data.nome.trim().length === 0) throw new Error('Nome da equipe não pode ser vazio');
      updateData.nome = data.nome.trim();
    }
    if (data.categoria !== undefined) updateData.categoria = data.categoria?.trim() || null;
    if (data.temporada !== undefined) updateData.temporada = data.temporada?.trim() || null;
    if (updateData.tecnicoId || updateData.clubeId) throw new Error('Não é permitido alterar o técnico ou clube da equipe');

    const equipe = await teamsRepository.update(id, updateData, tx);
    if (tenantInfo.tecnico_id && equipe.tecnicoId !== tenantInfo.tecnico_id) throw new Error('Erro ao atualizar equipe: validação de tenant falhou');
    if (tenantInfo.clube_id && equipe.clubeId !== tenantInfo.clube_id) throw new Error('Erro ao atualizar equipe: validação de tenant falhou');

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
  async delete(id: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<boolean> {
    if (!tenantInfo) throw new Error('Tenant info não fornecido');
    const existing = await teamsRepository.findById(id, tenantInfo, tx);
    if (!existing) throw new NotFoundError('Equipe', id);
    if (tenantInfo.tecnico_id && existing.tecnicoId !== tenantInfo.tecnico_id) throw new NotFoundError('Equipe', id);
    if (tenantInfo.clube_id && existing.clubeId !== tenantInfo.clube_id) throw new NotFoundError('Equipe', id);
    await teamsRepository.delete(id, tx);
    return true;
  },
};
