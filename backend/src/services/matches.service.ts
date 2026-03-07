/**
 * Service para Jogos/Matches
 * Lógica de negócio e orquestração
 */

import { TenantInfo } from '../utils/tenant.helper';
import { matchesRepository } from '../repositories/matches.repository';
import { transformMatchToFrontend } from '../adapters/match.adapter';
import { MatchRecord } from '../types/frontend';
import { NotFoundError } from '../utils/errors';

export const matchesService = {
  /**
   * Buscar todos os jogos do tenant
   */
  async getAll(tenantInfo: TenantInfo): Promise<MatchRecord[]> {
    // Buscar jogos do banco
    const jogos = await matchesRepository.findAll(tenantInfo);
    
    if (jogos.length === 0) {
      return [];
    }

    // Buscar estatísticas para cada jogo
    const matches: MatchRecord[] = [];
    
    for (const jogo of jogos) {
      const [estatisticasEquipe, estatisticasJogadores] = await Promise.all([
        matchesRepository.findEstatisticasEquipe(jogo.id),
        matchesRepository.findEstatisticasJogadores(jogo.id),
      ]);

      if (estatisticasEquipe) {
        matches.push(
          transformMatchToFrontend(
            jogo as any,
            estatisticasJogadores as any,
            estatisticasEquipe as any
          )
        );
      }
    }

    return matches;
  },

  /**
   * Buscar jogo por ID
   */
  async getById(id: string, tenantInfo: TenantInfo): Promise<MatchRecord> {
    const jogo = await matchesRepository.findById(id, tenantInfo);
    
    if (!jogo) {
      throw new NotFoundError('Jogo', id);
    }

    // Buscar estatísticas
    const [estatisticasEquipe, estatisticasJogadores] = await Promise.all([
      matchesRepository.findEstatisticasEquipe(id),
      matchesRepository.findEstatisticasJogadores(id),
    ]);

    if (!estatisticasEquipe) {
      throw new NotFoundError('Estatísticas do jogo', id);
    }

    return transformMatchToFrontend(
      jogo as any,
      estatisticasJogadores as any,
      estatisticasEquipe as any
    );
  },

  /**
   * Criar novo jogo
   * Aceita payload do frontend (MatchRecord) ou formato legado (equipeId, adversario, data)
   */
  async create(data: any, tenantInfo: TenantInfo): Promise<MatchRecord> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) {
      throw new NotFoundError('Equipe', 'Nenhuma equipe encontrada para o tenant');
    }

    // Adapter: aceitar payload do frontend (opponent, date, goalsFor, goalsAgainst, teamStats, playerStats)
    const equipeId = data.equipeId || equipeIds[0];
    const adversario = data.adversario ?? data.opponent ?? '';
    let dataDate: Date = data.data ?? (typeof data.date === 'string' ? new Date(data.date) : data.date);
    if (!dataDate || !(dataDate instanceof Date) || isNaN(dataDate.getTime())) {
      dataDate = new Date();
    }
    const golsPro = data.golsPro ?? data.goalsFor ?? 0;
    const golsContra = data.golsContra ?? data.goalsAgainst ?? 0;

    if (!equipeIds.includes(equipeId)) {
      throw new NotFoundError('Equipe', equipeId);
    }

    const teamStats = data.teamStats || {};
    const playerStats = data.playerStats || {};

    // Criar jogo com JSON fields
    const jogo = await matchesRepository.create({
      equipeId,
      adversario,
      data: dataDate,
      campeonato: data.campeonato ?? data.competition,
      competicaoId: data.competicaoId,
      local: data.local,
      resultado: data.resultado ?? data.result,
      golsPro,
      golsContra,
      videoUrl: data.videoUrl,
      postMatchEventLog: data.postMatchEventLog,
      playerRelationships: data.playerRelationships,
      lineup: data.lineup,
      substitutionHistory: data.substitutionHistory,
    });

    // Persistir estatísticas da equipe (teamStats do frontend)
    await matchesRepository.upsertEstatisticasEquipe(jogo.id, {
      minutosJogados: 40,
      gols: teamStats.goals ?? golsPro,
      golsSofridos: teamStats.goalsConceded ?? golsContra,
      assistencias: teamStats.assists ?? 0,
      cartoesAmarelos: 0,
      cartoesVermelhos: 0,
      passesCorretos: teamStats.passesCorrect ?? 0,
      passesErrados: teamStats.passesWrong ?? 0,
      passesErradosTransicao: teamStats.transitionErrors ?? 0,
      desarmesComBola: teamStats.tacklesWithBall ?? 0,
      desarmesContraAtaque: teamStats.tacklesCounterAttack ?? 0,
      desarmesSemBola: teamStats.tacklesWithoutBall ?? 0,
      chutesNoGol: teamStats.shotsOnTarget ?? 0,
      chutesFora: teamStats.shotsOffTarget ?? 0,
      rpePartida: null,
      golsMarcadosJogoAberto: 0,
      golsMarcadosBolaParada: 0,
      golsSofridosJogoAberto: 0,
      golsSofridosBolaParada: 0,
    });

    // Persistir estatísticas dos jogadores (playerStats do frontend)
    for (const [jogadorId, stats] of Object.entries(playerStats)) {
      const s = stats as any;
      await matchesRepository.upsertEstatisticasJogador(jogo.id, jogadorId, {
        minutosJogados: 40,
        gols: s.goals ?? 0,
        golsSofridos: 0,
        assistencias: s.assists ?? 0,
        cartoesAmarelos: 0,
        cartoesVermelhos: 0,
        passesCorretos: s.passesCorrect ?? 0,
        passesErrados: s.passesWrong ?? 0,
        passesErradosTransicao: s.transitionErrors ?? 0,
        desarmesComBola: s.tacklesWithBall ?? 0,
        desarmesContraAtaque: s.tacklesCounterAttack ?? 0,
        desarmesSemBola: s.tacklesWithoutBall ?? 0,
        chutesNoGol: s.shotsOnTarget ?? 0,
        chutesFora: s.shotsOffTarget ?? 0,
        rpePartida: null,
        golsMarcadosJogoAberto: 0,
        golsMarcadosBolaParada: 0,
        golsSofridosJogoAberto: 0,
        golsSofridosBolaParada: 0,
      });
    }

    const [estatisticasEquipe, estatisticasJogadores] = await Promise.all([
      matchesRepository.findEstatisticasEquipe(jogo.id),
      matchesRepository.findEstatisticasJogadores(jogo.id),
    ]);

    return transformMatchToFrontend(
      jogo as any,
      estatisticasJogadores as any,
      estatisticasEquipe || undefined
    );
  },

  /**
   * Atualizar jogo
   */
  async update(id: string, data: Partial<any>, tenantInfo: TenantInfo): Promise<MatchRecord> {
    // Verificar se jogo existe e pertence ao tenant
    const existing = await matchesRepository.findById(id, tenantInfo);
    if (!existing) {
      throw new NotFoundError('Jogo', id);
    }

    // Atualizar
    const jogo = await matchesRepository.update(id, data);

    // Buscar estatísticas
    const [estatisticasEquipe, estatisticasJogadores] = await Promise.all([
      matchesRepository.findEstatisticasEquipe(id),
      matchesRepository.findEstatisticasJogadores(id),
    ]);

    if (!estatisticasEquipe) {
      throw new NotFoundError('Estatísticas do jogo', id);
    }

    return transformMatchToFrontend(
      jogo as any,
      estatisticasJogadores as any,
      estatisticasEquipe as any
    );
  },

  /**
   * Deletar jogo
   */
  async delete(id: string, tenantInfo: TenantInfo): Promise<boolean> {
    // Verificar se jogo existe e pertence ao tenant
    const existing = await matchesRepository.findById(id, tenantInfo);
    if (!existing) {
      throw new NotFoundError('Jogo', id);
    }

    await matchesRepository.delete(id);
    return true;
  },
};

