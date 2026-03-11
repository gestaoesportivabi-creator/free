/**
 * Service para Jogos/Matches
 * Lógica de negócio e orquestração
 */

import { TenantInfo } from '../utils/tenant.helper';
import type { TransactionClient } from '../utils/transactionWithTenant';
import { matchesRepository } from '../repositories/matches.repository';
import { playersRepository } from '../repositories/players.repository';
import { teamsRepository } from '../repositories/teams.repository';
import { transformMatchToFrontend } from '../adapters/match.adapter';
import { MatchRecord } from '../types/frontend';
import { NotFoundError } from '../utils/errors';

export const matchesService = {
  async getAll(tenantInfo: TenantInfo, tx?: TransactionClient): Promise<MatchRecord[]> {
    const jogos = await matchesRepository.findAll(tenantInfo, tx);
    if (jogos.length === 0) return [];

    const jogoIds = jogos.map((j) => j.id);
    const [todasEquipe, todosJogadores] = await Promise.all([
      matchesRepository.findEstatisticasEquipeByJogoIds(jogoIds, tx),
      matchesRepository.findEstatisticasJogadoresByJogoIds(jogoIds, tx),
    ]);
    const porJogoEquipe = new Map<string, (typeof todasEquipe)[0]>();
    for (const e of todasEquipe) porJogoEquipe.set(e.jogoId, e);
    const porJogoJogadores = new Map<string, (typeof todosJogadores)[0][]>();
    for (const j of todosJogadores) {
      const arr = porJogoJogadores.get(j.jogoId) ?? [];
      arr.push(j);
      porJogoJogadores.set(j.jogoId, arr);
    }

    const [statusMap, metodoGolMap] = await Promise.all([
      matchesRepository.getStatusByIds(jogoIds),
      matchesRepository.getMetodoGolByJogoIds(jogoIds),
    ]);

    const matches: MatchRecord[] = [];
    for (const jogo of jogos) {
      const estatisticasEquipe = porJogoEquipe.get(jogo.id);
      const estatisticasJogadores = porJogoJogadores.get(jogo.id) ?? [];
      const match = transformMatchToFrontend(jogo as any, estatisticasJogadores as any, estatisticasEquipe as any);
      const st = statusMap.get(jogo.id);
      match.status = (st || 'encerrado') as MatchRecord['status'];
      const mg = metodoGolMap.get(jogo.id);
      if (mg && match.teamStats) {
        try { match.teamStats.goalMethodsScored = JSON.parse(mg); } catch { /* ignore */ }
      }
      matches.push(match);
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

    const match = transformMatchToFrontend(jogo as any, estatisticasJogadores as any, estatisticasEquipe as any);
    const [statusMap, metodoGolMap] = await Promise.all([
      matchesRepository.getStatusByIds([id]),
      matchesRepository.getMetodoGolByJogoIds([id]),
    ]);
    const st = statusMap.get(id);
    match.status = (st || 'encerrado') as MatchRecord['status'];
    const mg = metodoGolMap.get(id);
    if (mg && match.teamStats) {
      try { match.teamStats.goalMethodsScored = JSON.parse(mg); } catch { /* ignore */ }
    }
    return match;
  },

  async create(data: any, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<MatchRecord> {
    let equipeIds = tenantInfo.equipe_ids || [];

    // Se não há equipes mas o tenant tem técnico, criar equipe padrão "Elenco"
    if (equipeIds.length === 0 && tenantInfo.tecnico_id) {
      try {
        const novaEquipe = await teamsRepository.create(
          { nome: 'Elenco', tecnicoId: tenantInfo.tecnico_id },
          tx
        );
        equipeIds = [novaEquipe.id];
        tenantInfo.equipe_ids = equipeIds;
        console.log('[MATCHES_SERVICE] Equipe padrão "Elenco" criada para técnico:', tenantInfo.tecnico_id);
      } catch (e) {
        console.error('[MATCHES_SERVICE] Erro ao criar equipe padrão:', e);
        throw new NotFoundError('Equipe', 'Nenhuma equipe encontrada. Crie uma equipe em Gestão de Equipe antes de salvar partidas.');
      }
    }
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
    }, tx);

    // Salvar status via raw SQL (coluna fora do Prisma schema)
    const matchStatus = data.status || 'encerrado';
    await matchesRepository.setStatus(jogo.id, matchStatus, tx);

    // Extrair métodos de gol do postMatchEventLog
    let metodoGol: string | null = null;
    const eventLog = data.postMatchEventLog as Array<{ action?: string; goalMethod?: string; isOpponentGoal?: boolean }> | undefined;
    if (eventLog && Array.isArray(eventLog)) {
      const methodCounts: Record<string, number> = {};
      for (const ev of eventLog) {
        if (ev.action === 'goal' && ev.goalMethod && !ev.isOpponentGoal) {
          methodCounts[ev.goalMethod] = (methodCounts[ev.goalMethod] || 0) + 1;
        }
      }
      if (Object.keys(methodCounts).length > 0) {
        metodoGol = JSON.stringify(methodCounts);
      }
    }
    if (!metodoGol && teamStats.goalMethodsScored && Object.keys(teamStats.goalMethodsScored).length > 0) {
      metodoGol = JSON.stringify(teamStats.goalMethodsScored);
    }

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

    if (metodoGol) {
      await matchesRepository.setMetodoGol(jogo.id, metodoGol, tx);
    }

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

    const result = transformMatchToFrontend(
      jogo as any,
      estatisticasJogadores as any,
      estatisticasEquipe || undefined
    );
    result.status = matchStatus as MatchRecord['status'];
    if (metodoGol && result.teamStats) {
      try { result.teamStats.goalMethodsScored = JSON.parse(metodoGol); } catch { /* ignore */ }
    }
    return result;
  },

  async update(id: string, data: Partial<any>, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<MatchRecord> {
    const existing = await matchesRepository.findById(id, tenantInfo, tx);
    if (!existing) throw new NotFoundError('Jogo', id);

    const golsPro = data.golsPro ?? data.goalsFor ?? existing.golsPro;
    const golsContra = data.golsContra ?? data.goalsAgainst ?? existing.golsContra;

    const jogoUpdate: Record<string, unknown> = {};
    if (data.adversario ?? data.opponent) jogoUpdate.adversario = data.adversario ?? data.opponent;
    if (data.data ?? data.date) {
      const d = data.data ?? (typeof data.date === 'string' ? new Date(data.date) : data.date);
      if (d instanceof Date && !isNaN(d.getTime())) jogoUpdate.data = d;
    }
    if (data.campeonato ?? data.competition) jogoUpdate.campeonato = data.campeonato ?? data.competition;
    if (data.resultado ?? data.result) jogoUpdate.resultado = data.resultado ?? data.result;
    jogoUpdate.golsPro = golsPro;
    jogoUpdate.golsContra = golsContra;
    if (data.postMatchEventLog !== undefined) jogoUpdate.postMatchEventLog = data.postMatchEventLog;
    if (data.playerRelationships !== undefined) jogoUpdate.playerRelationships = data.playerRelationships;
    if (data.lineup !== undefined) jogoUpdate.lineup = data.lineup;
    if (data.substitutionHistory !== undefined) jogoUpdate.substitutionHistory = data.substitutionHistory;
    const jogo = await matchesRepository.update(id, jogoUpdate as any, tx);

    // Salvar status via raw SQL (coluna fora do Prisma schema)
    if (data.status !== undefined) {
      await matchesRepository.setStatus(id, data.status, tx);
    }

    // Update team stats if provided
    const teamStats = data.teamStats;
    if (teamStats) {
      let metodoGol: string | null = null;
      const eventLog = data.postMatchEventLog as Array<{ action?: string; goalMethod?: string; isOpponentGoal?: boolean }> | undefined;
      if (eventLog && Array.isArray(eventLog)) {
        const methodCounts: Record<string, number> = {};
        for (const ev of eventLog) {
          if (ev.action === 'goal' && ev.goalMethod && !ev.isOpponentGoal) {
            methodCounts[ev.goalMethod] = (methodCounts[ev.goalMethod] || 0) + 1;
          }
        }
        if (Object.keys(methodCounts).length > 0) {
          metodoGol = JSON.stringify(methodCounts);
        }
      }
      if (!metodoGol && teamStats.goalMethodsScored && Object.keys(teamStats.goalMethodsScored).length > 0) {
        metodoGol = JSON.stringify(teamStats.goalMethodsScored);
      }

      await matchesRepository.upsertEstatisticasEquipe(id, {
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

      if (metodoGol) {
        await matchesRepository.setMetodoGol(id, metodoGol, tx);
      }
    }

    // Update player stats if provided
    const playerStats = data.playerStats;
    if (playerStats && Object.keys(playerStats).length > 0) {
      const jogadoresTenant = await playersRepository.findAll(tenantInfo, tx);
      const validJogadorIds = new Set(jogadoresTenant.map((j) => j.id));
      for (const [jogadorId, stats] of Object.entries(playerStats)) {
        if (!validJogadorIds.has(jogadorId.trim())) continue;
        const s = stats as any;
        await matchesRepository.upsertEstatisticasJogador(id, jogadorId.trim(), {
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
    }

    const [estatisticasEquipe, estatisticasJogadores] = await Promise.all([
      matchesRepository.findEstatisticasEquipe(id, tx),
      matchesRepository.findEstatisticasJogadores(id, tx),
    ]);

    const result = transformMatchToFrontend(jogo as any, estatisticasJogadores as any, estatisticasEquipe || undefined);
    const [statusMap, metodoGolMap] = await Promise.all([
      matchesRepository.getStatusByIds([id]),
      matchesRepository.getMetodoGolByJogoIds([id]),
    ]);
    const st = statusMap.get(id);
    result.status = (st || 'encerrado') as MatchRecord['status'];
    const mg = metodoGolMap.get(id);
    if (mg && result.teamStats) {
      try { result.teamStats.goalMethodsScored = JSON.parse(mg); } catch { /* ignore */ }
    }
    return result;
  },

  async delete(id: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<boolean> {
    const existing = await matchesRepository.findById(id, tenantInfo, tx);
    if (!existing) throw new NotFoundError('Jogo', id);
    await matchesRepository.delete(id, tx);
    return true;
  },
};

