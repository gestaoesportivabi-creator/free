/**
 * Service para Jogos/Matches
 * Lógica de negócio e orquestração
 */

import { TenantInfo } from '../utils/tenant.helper';
import type { TransactionClient } from '../utils/transactionWithTenant';
import { matchesRepository } from '../repositories/matches.repository';
import { playersRepository } from '../repositories/players.repository';
import { transformMatchToFrontend } from '../adapters/match.adapter';
import { MatchRecord } from '../types/frontend';
import { NotFoundError } from '../utils/errors';

export const matchesService = {
  async getAll(tenantInfo: TenantInfo, tx?: TransactionClient): Promise<MatchRecord[]> {
    const jogos = await matchesRepository.findAll(tenantInfo, tx);
    if (jogos.length === 0) return [];

    const matches: MatchRecord[] = [];
    for (const jogo of jogos) {
      const [estatisticasEquipe, estatisticasJogadores] = await Promise.all([
        matchesRepository.findEstatisticasEquipe(jogo.id, tx),
        matchesRepository.findEstatisticasJogadores(jogo.id, tx),
      ]);
      if (estatisticasEquipe) {
        matches.push(
          transformMatchToFrontend(jogo as any, estatisticasJogadores as any, estatisticasEquipe as any)
        );
      }
    }
    return matches;
  },

  async getById(id: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<MatchRecord> {
    const jogo = await matchesRepository.findById(id, tenantInfo, tx);
    if (!jogo) throw new NotFoundError('Jogo', id);

    const [estatisticasEquipe, estatisticasJogadores] = await Promise.all([
      matchesRepository.findEstatisticasEquipe(id, tx),
      matchesRepository.findEstatisticasJogadores(id, tx),
    ]);
    if (!estatisticasEquipe) throw new NotFoundError('Estatísticas do jogo', id);

    return transformMatchToFrontend(jogo as any, estatisticasJogadores as any, estatisticasEquipe as any);
  },

  async create(data: any, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<MatchRecord> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) throw new NotFoundError('Equipe', 'Nenhuma equipe encontrada para o tenant');

    const equipeId = data.equipeId || equipeIds[0];
    const adversario = data.adversario ?? data.opponent ?? '';
    let dataDate: Date = data.data ?? (typeof data.date === 'string' ? new Date(data.date) : data.date);
    if (!dataDate || !(dataDate instanceof Date) || isNaN(dataDate.getTime())) dataDate = new Date();
    const golsPro = data.golsPro ?? data.goalsFor ?? 0;
    const golsContra = data.golsContra ?? data.goalsAgainst ?? 0;

    if (!equipeIds.includes(equipeId)) throw new NotFoundError('Equipe', equipeId);

    const teamStats = data.teamStats || {};
    const playerStats = data.playerStats || {};

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
      possessionSecondsWith: data.possessionSecondsWith ?? 0,
      possessionSecondsWithout: data.possessionSecondsWithout ?? 0,
    }, tx);

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
    }, tx);

    const jogadoresTenant = await playersRepository.findAll(tenantInfo, tx);
    const validJogadorIds = new Set(jogadoresTenant.map((j) => j.id));
    for (const [jogadorId, stats] of Object.entries(playerStats)) {
      if (!validJogadorIds.has(jogadorId.trim())) continue;
      const s = stats as any;
      await matchesRepository.upsertEstatisticasJogador(jogo.id, jogadorId.trim(), {
        minutosJogados: 40,
        gols: s.goals ?? 0,
        golsSofridos: 0,
        assistencias: s.assists ?? 0,
        cartoesAmarelos: s.yellowCards ?? 0,
        cartoesVermelhos: s.redCards ?? 0,
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
      }, tx);
    }

    const [estatisticasEquipe, estatisticasJogadores] = await Promise.all([
      matchesRepository.findEstatisticasEquipe(jogo.id, tx),
      matchesRepository.findEstatisticasJogadores(jogo.id, tx),
    ]);

    return transformMatchToFrontend(
      jogo as any,
      estatisticasJogadores as any,
      estatisticasEquipe || undefined
    );
  },

  async update(id: string, data: Partial<any>, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<MatchRecord> {
    const existing = await matchesRepository.findById(id, tenantInfo, tx);
    if (!existing) throw new NotFoundError('Jogo', id);

    const updatePayload: Record<string, unknown> = { ...data };
    if (data.goalsFor !== undefined) updatePayload.golsPro = data.goalsFor;
    if (data.goalsAgainst !== undefined) updatePayload.golsContra = data.goalsAgainst;
    if (data.possessionSecondsWith !== undefined) updatePayload.possessionSecondsWith = data.possessionSecondsWith;
    if (data.possessionSecondsWithout !== undefined) updatePayload.possessionSecondsWithout = data.possessionSecondsWithout;

    const jogo = await matchesRepository.update(id, updatePayload as any, tx);
    const [estatisticasEquipe, estatisticasJogadores] = await Promise.all([
      matchesRepository.findEstatisticasEquipe(id, tx),
      matchesRepository.findEstatisticasJogadores(id, tx),
    ]);
    if (!estatisticasEquipe) throw new NotFoundError('Estatísticas do jogo', id);

    return transformMatchToFrontend(jogo as any, estatisticasJogadores as any, estatisticasEquipe as any);
  },

  async delete(id: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<boolean> {
    const existing = await matchesRepository.findById(id, tenantInfo, tx);
    if (!existing) throw new NotFoundError('Jogo', id);
    await matchesRepository.delete(id, tx);
    return true;
  },
};

