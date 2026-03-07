/**
 * Service para Jogos de Campeonato
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';
import { championshipMatchesRepository } from '../repositories/championshipMatches.repository';
import { NotFoundError } from '../utils/errors';

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
  async getAll(tenantInfo: TenantInfo) {
    const jogos = await championshipMatchesRepository.findAll(tenantInfo);
    return jogos.map(transformChampionshipMatchToFrontend);
  },

  /**
   * Buscar jogo por ID
   */
  async getById(id: string, tenantInfo: TenantInfo) {
    const jogo = await championshipMatchesRepository.findById(id, tenantInfo);
    
    if (!jogo) {
      throw new NotFoundError('Jogo de campeonato', id);
    }

    return transformChampionshipMatchToFrontend(jogo);
  },

  /**
   * Criar jogo de campeonato
   */
  async create(data: any, tenantInfo: TenantInfo) {
    // Garantir que temos um campeonato padrão para a equipe
    const equipeId = tenantInfo.equipe_ids?.[0];
    if (!equipeId) {
      throw new Error('Equipe não encontrada para o tenant');
    }

    // Buscar ou criar campeonato padrão "Jogos Agendados"
    let campeonato = await prisma.campeonato.findFirst({
      where: {
        equipeId: equipeId,
        nome: 'Jogos Agendados',
      },
    });

    if (!campeonato) {
      campeonato = await prisma.campeonato.create({
        data: {
          equipeId: equipeId,
          nome: 'Jogos Agendados',
        },
      });
    }

    // Transformar dados do frontend para formato do banco
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

    const jogo = await championshipMatchesRepository.create(jogoData);
    return transformChampionshipMatchToFrontend(jogo);
  },

  /**
   * Atualizar jogo de campeonato
   */
  async update(id: string, data: Partial<any>, tenantInfo: TenantInfo) {
    const existing = await championshipMatchesRepository.findById(id, tenantInfo);
    if (!existing) {
      throw new NotFoundError('Jogo de campeonato', id);
    }

    // Transformar dados do frontend para formato do banco
    const jogoData: any = {};
    if (data.date) jogoData.data = new Date(data.date);
    if (data.time !== undefined) jogoData.horario = data.time || null;
    if (data.opponent !== undefined) jogoData.adversario = data.opponent;
    if (data.competition !== undefined) jogoData.competicao = data.competition || null;
    if (data.location !== undefined) jogoData.local = data.location || null;
    if (data.scoreTarget !== undefined) jogoData.metaPontuacao = data.scoreTarget || null;

    const jogo = await championshipMatchesRepository.update(id, jogoData);
    return transformChampionshipMatchToFrontend(jogo);
  },

  /**
   * Deletar jogo de campeonato
   */
  async delete(id: string, tenantInfo: TenantInfo): Promise<boolean> {
    const existing = await championshipMatchesRepository.findById(id, tenantInfo);
    if (!existing) {
      throw new NotFoundError('Jogo de campeonato', id);
    }

    await championshipMatchesRepository.delete(id);
    return true;
  },
};

