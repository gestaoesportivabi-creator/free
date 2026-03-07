/**
 * Service para Jogos de Campeonato
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';
import type { TransactionClient } from '../utils/transactionWithTenant';
import { championshipMatchesRepository } from '../repositories/championshipMatches.repository';
import { NotFoundError } from '../utils/errors';

function db(tx?: TransactionClient) {
  return tx ?? prisma;
}

// Transformar jogo de campeonato do banco para frontend
function transformChampionshipMatchToFrontend(jogo: any) {
  return {
    id: jogo.id,
    date: jogo.data instanceof Date ? jogo.data.toISOString().split('T')[0] : jogo.data,
    time: jogo.horario || '',
    opponent: jogo.adversario,
    competition: jogo.competicao || '',
    location: jogo.local || '',
    scoreTarget: jogo.metaPontuacao || '',
  };
}

export const championshipMatchesService = {
  /**
   * Buscar todos os jogos de campeonato do tenant
   */
  async getAll(tenantInfo: TenantInfo, tx?: TransactionClient) {
    const jogos = await championshipMatchesRepository.findAll(tenantInfo, tx);
    return jogos.map(transformChampionshipMatchToFrontend);
  },

  async getById(id: string, tenantInfo: TenantInfo, tx?: TransactionClient) {
    const jogo = await championshipMatchesRepository.findById(id, tenantInfo, tx);
    if (!jogo) throw new NotFoundError('Jogo de campeonato', id);
    return transformChampionshipMatchToFrontend(jogo);
  },

  async create(data: any, tenantInfo: TenantInfo, tx?: TransactionClient) {
    const equipeId = tenantInfo.equipe_ids?.[0];
    if (!equipeId) throw new Error('Equipe não encontrada para o tenant');

    let campeonato = await db(tx).campeonato.findFirst({
      where: { equipeId, nome: 'Jogos Agendados' },
    });
    if (!campeonato) {
      campeonato = await db(tx).campeonato.create({
        data: { equipeId, nome: 'Jogos Agendados' },
      });
    }

    const jogoData = {
      campeonatoId: campeonato.id,
      data: new Date(data.date),
      horario: data.time || null,
      equipe: 'Minha Equipe',
      adversario: data.opponent,
      competicao: data.competition || null,
      local: data.location || null,
      metaPontuacao: data.scoreTarget || null,
    };

    const jogo = await championshipMatchesRepository.create(jogoData, tx);
    return transformChampionshipMatchToFrontend(jogo);
  },

  async update(id: string, data: Partial<any>, tenantInfo: TenantInfo, tx?: TransactionClient) {
    const existing = await championshipMatchesRepository.findById(id, tenantInfo, tx);
    if (!existing) throw new NotFoundError('Jogo de campeonato', id);

    const jogoData: any = {};
    if (data.date) jogoData.data = new Date(data.date);
    if (data.time !== undefined) jogoData.horario = data.time || null;
    if (data.opponent !== undefined) jogoData.adversario = data.opponent;
    if (data.competition !== undefined) jogoData.competicao = data.competition || null;
    if (data.location !== undefined) jogoData.local = data.location || null;
    if (data.scoreTarget !== undefined) jogoData.metaPontuacao = data.scoreTarget || null;

    const jogo = await championshipMatchesRepository.update(id, jogoData, tx);
    return transformChampionshipMatchToFrontend(jogo);
  },

  async delete(id: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<boolean> {
    const existing = await championshipMatchesRepository.findById(id, tenantInfo, tx);
    if (!existing) throw new NotFoundError('Jogo de campeonato', id);
    await championshipMatchesRepository.delete(id, tx);
    return true;
  },
};

