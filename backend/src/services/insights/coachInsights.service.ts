/**
 * Insights para comissão técnica — portado do frontend (DashboardInterpretiveAlerts, ManagementReport)
 * Lê dados do PostgreSQL (não localStorage).
 */

import prisma from '../../config/database';
import { TenantInfo } from '../../utils/tenant.helper';
import { playersService } from '../players.service';
import { listOpponentsWithSeed } from './coachOpponents.service';
import type { Player } from '../../types/frontend';

export type RiskLevel = 'green' | 'yellow' | 'red';

export interface InterpretiveAlert {
  phrase: string;
  risk: RiskLevel;
  icon?: 'sleep' | 'pse' | 'injury' | 'general';
}

export interface ReadinessPlayer {
  jogadorId: string;
  name: string;
  score: number;
  flags: string[];
}

export interface TeamReadinessResult {
  teamScore: number;
  sessionRecommendation: 'light' | 'moderate' | 'hard';
  sessionRationale: string;
  alerts: InterpretiveAlert[];
  playersAtRisk: ReadinessPlayer[];
  avgSleep: number | null;
  avgPse: number | null;
}

export interface RosterPlayerStatus {
  id: string;
  name: string;
  nickname?: string;
  position?: string;
  status: 'available' | 'injured' | 'transferred';
  activeInjury?: string;
}

export interface WellnessEngagementAlert {
  dimension: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

export interface MatchHistoryItem {
  id: string;
  date: string;
  opponent: string;
  result: string | null;
  goalsFor: number;
  goalsAgainst: number;
  competition: string | null;
  location: string | null;
  topScorer: { name: string; goals: number } | null;
}

export interface MatchHistoryResult {
  total: number;
  record: { wins: number; draws: number; losses: number };
  matches: MatchHistoryItem[];
}

const STAFF_ROLES = new Set(['ESSENCIAL', 'COMPETICAO', 'PERFORMANCE', 'ADMINISTRADOR']);

const WELLNESS_IDEAL: Record<string, number> = {
  stress: 2,
  sono: 5,
  humor: 5,
  dor: 2.5,
  satisfacao: 5,
};

const LOWER_IS_BETTER = new Set(['stress', 'dor']);

const GOAL_BY_PERIOD_LABELS = [
  '00:01 - 05:00',
  '05:01 - 10:00',
  '10:01 - 15:00',
  '15:01 - 20:00',
  '20:01 - 25:00',
  '25:01 - 30:00',
  '30:01 - 35:00',
  '35:01 - 40:00',
  '40:01 - 45:00',
  '45:01 - 50:00',
];

const SET_PIECE_METHODS = ['ESCANTEIO', 'FALTAS', 'PÊNALTI', 'TIRO LIVRE', 'LATERAIS'];

function teamAvg(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function isMorningTime(timeStr: string): boolean {
  if (!timeStr?.trim()) return false;
  const [h] = timeStr.split(':').map(Number);
  return (h ?? 0) < 12;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function requireEquipeIds(tenantInfo: TenantInfo): string[] {
  const ids = tenantInfo.equipe_ids ?? [];
  if (ids.length === 0) throw new Error('Nenhuma equipe vinculada ao tenant');
  return ids;
}

async function loadTeamContext(tenantInfo: TenantInfo) {
  const equipeIds = requireEquipeIds(tenantInfo);
  const today = new Date(formatDate(new Date()) + 'T12:00:00.000Z');
  const d7 = new Date(today);
  d7.setDate(d7.getDate() - 7);
  const d28 = new Date(today);
  d28.setDate(d28.getDate() - 28);

  const [players, schedules, championshipMatches, pseTreinos, pseJogos, qualidadeSono, bemEstar, matches] =
    await Promise.all([
      playersService.getAll(tenantInfo),
      prisma.programacao.findMany({
        where: { equipeId: { in: equipeIds }, isAtivo: true },
        include: { dias: true },
      }),
      prisma.campeonatosJogos.findMany({
        where: { campeonato: { equipeId: { in: equipeIds } } },
        orderBy: { data: 'asc' },
      }),
      prisma.pseTreino.findMany({
        where: { equipeId: { in: equipeIds }, data: { gte: d28 } },
      }),
      prisma.pseJogo.findMany({
        where: { jogo: { equipeId: { in: equipeIds } } },
        include: { jogo: { select: { data: true, equipeId: true } } },
      }),
      prisma.qualidadeSono.findMany({
        where: { equipeId: { in: equipeIds }, data: { gte: d28 } },
      }),
      prisma.bem_estar_diario.findMany({
        where: { equipe_id: { in: equipeIds }, data: { gte: d28 } },
      }),
      prisma.jogo.findMany({
        where: { equipeId: { in: equipeIds } },
        orderBy: { data: 'desc' },
        take: 20,
        include: {
          estatisticasEquipe: true,
          pseJogos: true,
        },
      }),
    ]);

  return {
    equipeIds,
    today,
    d7,
    d28,
    players,
    schedules,
    championshipMatches,
    pseTreinos,
    pseJogos,
    qualidadeSono,
    bemEstar,
    matches,
  };
}

function buildVigentSonoKeys(
  schedules: Awaited<ReturnType<typeof loadTeamContext>>['schedules'],
  championshipMatches: Awaited<ReturnType<typeof loadTeamContext>>['championshipMatches']
): Set<string> {
  const keys = new Set<string>();
  schedules.forEach((s) => {
    s.dias.forEach((day) => {
      const act = (day.atividade || '').trim();
      if (act !== 'Treino' && act !== 'Musculação') return;
      const date = formatDate(day.data);
      const time = day.horario || '00:00';
      if (!date || !isMorningTime(time)) return;
      keys.add(`treino_${date}`);
    });
  });
  championshipMatches.forEach((m) => {
    if (m.data) keys.add(`jogo_${formatDate(m.data)}`);
  });
  return keys;
}

function buildVigentPseKeys(schedules: Awaited<ReturnType<typeof loadTeamContext>>['schedules']): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  schedules.forEach((s) => {
    s.dias.forEach((day) => {
      const act = (day.atividade || '').trim();
      if (act !== 'Treino' && act !== 'Musculação') return;
      const date = formatDate(day.data);
      const time = day.horario || '00:00';
      const key = `${date}_${time}_${act}`;
      if (!date || seen.has(key)) return;
      seen.add(key);
      keys.push(key);
    });
  });
  return keys;
}

function playerHasActiveInjury(p: Player): boolean {
  if (!p.injuryHistory?.length) return false;
  return p.injuryHistory.some((inj) => !inj.endDate);
}

export function buildInterpretiveAlerts(ctx: Awaited<ReturnType<typeof loadTeamContext>>): InterpretiveAlert[] {
  const list: InterpretiveAlert[] = [];
  const { players, schedules, championshipMatches, pseTreinos, pseJogos, qualidadeSono, d7, d28 } = ctx;

  const injuredCount = players.filter(playerHasActiveInjury).length;
  if (injuredCount > 0) {
    list.push({
      phrase: `${injuredCount} atleta${injuredCount !== 1 ? 's' : ''} em recuperação. Acompanhar evolução no departamento médico.`,
      risk: injuredCount >= 3 ? 'red' : 'yellow',
      icon: 'injury',
    });
  }

  const vigentSonoKeys = buildVigentSonoKeys(schedules, championshipMatches);
  const vigentPseKeys = buildVigentPseKeys(schedules);

  const sonoByEvent = new Map<string, number[]>();
  qualidadeSono.forEach((row) => {
    const dateKey = formatDate(row.data);
    const eventKey = `treino_${dateKey}`;
    if (!vigentSonoKeys.has(eventKey) && !vigentSonoKeys.has(`jogo_${dateKey}`)) return;
    const key = vigentSonoKeys.has(eventKey) ? eventKey : `jogo_${dateKey}`;
    if (!sonoByEvent.has(key)) sonoByEvent.set(key, []);
    sonoByEvent.get(key)!.push(row.valor);
  });

  const sonoAverages: number[] = [];
  sonoByEvent.forEach((vals) => {
    const filtered = vals.filter((v) => v >= 1 && v <= 5);
    const avg = teamAvg(filtered);
    if (avg != null) sonoAverages.push(avg);
  });
  const avgSono = sonoAverages.length > 0 ? teamAvg(sonoAverages) : null;

  const pseAverages: number[] = [];
  vigentPseKeys.forEach((sessionKey) => {
    const [date] = sessionKey.split('_');
    const rows = pseTreinos.filter(
      (r: { data: Date; valor: number }) => formatDate(r.data) === date && r.valor >= 0 && r.valor <= 10
    );
    if (rows.length === 0) return;
    const avg = teamAvg(rows.map((r) => r.valor));
    if (avg != null) pseAverages.push(avg);
  });

  const pseByMatch = new Map<string, number[]>();
  pseJogos.forEach((row) => {
    const matchDate = formatDate(row.jogo.data);
    if (!pseByMatch.has(matchDate)) pseByMatch.set(matchDate, []);
    pseByMatch.get(matchDate)!.push(row.valor);
  });
  pseByMatch.forEach((vals) => {
    const filtered = vals.filter((v) => v >= 0 && v <= 10);
    const avg = teamAvg(filtered);
    if (avg != null) pseAverages.push(avg);
  });
  const avgPse = pseAverages.length > 0 ? teamAvg(pseAverages) : null;

  if (avgSono != null) {
    if (avgSono >= 4) {
      list.push({
        phrase: `Qualidade de sono da equipe em boa média (${avgSono}/5). Recuperação adequada.`,
        risk: 'green',
        icon: 'sleep',
      });
    } else if (avgSono >= 3) {
      list.push({
        phrase: `Sono médio em ${avgSono}/5. Monitorar recuperação antes do próximo compromisso.`,
        risk: 'yellow',
        icon: 'sleep',
      });
    } else {
      list.push({
        phrase: `Atenção: média de sono baixa (${avgSono}/5). Avaliar carga e descanso.`,
        risk: 'red',
        icon: 'sleep',
      });
    }
  }

  if (avgPse != null) {
    if (avgPse >= 7.5) {
      list.push({
        phrase: `PSE médio elevado (${avgPse}/10). Considerar recuperação ativa ou carga reduzida.`,
        risk: avgPse >= 8.5 ? 'red' : 'yellow',
        icon: 'pse',
      });
    } else if (avgPse >= 4 && avgPse < 7) {
      list.push({
        phrase: `PSE médio em nível adequado (${avgPse}/10). Carga dentro do esperado.`,
        risk: 'green',
        icon: 'pse',
      });
    } else if (avgPse < 4 && pseAverages.length >= 3) {
      list.push({
        phrase: `PSE médio baixo (${avgPse}/10). Equipe possivelmente subcarregada ou em recuperação.`,
        risk: 'yellow',
        icon: 'pse',
      });
    }
  }

  if (avgSono != null && avgPse != null && avgSono < 3.5 && avgPse >= 7) {
    list.push({
      phrase: 'Sono baixo com PSE alto: priorizar recuperação e evitar sobrecarga.',
      risk: 'red',
      icon: 'general',
    });
  }

  const allPseByPlayerDate: { jogadorId: string; date: Date; valor: number }[] = [];
  pseTreinos.forEach((r) => {
    allPseByPlayerDate.push({ jogadorId: r.jogadorId, date: r.data, valor: r.valor });
  });
  pseJogos.forEach((r) => {
    allPseByPlayerDate.push({ jogadorId: r.jogadorId, date: r.jogo.data, valor: r.valor });
  });

  const acwrRiskPlayers: string[] = [];
  players
    .filter((p) => !p.isTransferred)
    .forEach((p) => {
      let acute = 0,
        ac = 0,
        chronic = 0,
        cc = 0;
      allPseByPlayerDate
        .filter((e) => e.jogadorId === p.id)
        .forEach(({ date, valor }) => {
          const d = new Date(date);
          if (d >= d7) {
            acute += valor;
            ac++;
          }
          if (d >= d28) {
            chronic += valor;
            cc++;
          }
        });
      const acuteAvg = ac > 0 ? acute / ac : 0;
      const chronicAvg = cc > 0 ? chronic / cc : 0;
      if (chronicAvg > 0) {
        const acwr = acuteAvg / chronicAvg;
        if (acwr > 1.5) acwrRiskPlayers.push(p.nickname || p.name);
      }
    });

  if (acwrRiskPlayers.length > 0) {
    list.push({
      phrase: `ACWR elevado (>1.5) em: ${acwrRiskPlayers.slice(0, 3).join(', ')}${acwrRiskPlayers.length > 3 ? ` +${acwrRiskPlayers.length - 3}` : ''}. Risco de lesão aumentado.`,
      risk: 'red',
      icon: 'injury',
    });
  }

  if (pseAverages.length >= 5) {
    const mean = pseAverages.reduce((a, b) => a + b, 0) / pseAverages.length;
    const variance = pseAverages.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / pseAverages.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev < 0.5) {
      list.push({
        phrase: 'Monotonia de treino detectada (variação PSE < 0.5). Diversificar intensidades.',
        risk: 'yellow',
        icon: 'pse',
      });
    }
  }

  const lastSonoAvgs = sonoAverages.slice(-3);
  if (lastSonoAvgs.length >= 3 && lastSonoAvgs.every((v) => v < 3)) {
    list.push({
      phrase: 'Sono crônico insuficiente (média <3 nas últimas 3 sessões). Intervenção necessária.',
      risk: 'red',
      icon: 'sleep',
    });
  }

  return list;
}

function computePlayerReadiness(
  player: Player,
  ctx: Awaited<ReturnType<typeof loadTeamContext>>
): ReadinessPlayer {
  const flags: string[] = [];
  let score = 85;

  if (playerHasActiveInjury(player)) {
    flags.push('Lesão ativa');
    score -= 40;
  }
  if (player.isTransferred) {
    flags.push('Transferido');
    score -= 50;
  }

  const { pseTreinos, pseJogos, bemEstar, d7, d28 } = ctx;
  let acute = 0,
    ac = 0,
    chronic = 0,
    cc = 0;

  pseTreinos
    .filter((r) => r.jogadorId === player.id)
    .forEach((r) => {
      const d = new Date(r.data);
      if (d >= d7) {
        acute += r.valor;
        ac++;
      }
      if (d >= d28) {
        chronic += r.valor;
        cc++;
      }
    });
  pseJogos
    .filter((r) => r.jogadorId === player.id)
    .forEach((r) => {
      const d = new Date(r.jogo.data);
      if (d >= d7) {
        acute += r.valor;
        ac++;
      }
      if (d >= d28) {
        chronic += r.valor;
        cc++;
      }
    });

  const chronicAvg = cc > 0 ? chronic / cc : 0;
  const acuteAvg = ac > 0 ? acute / ac : 0;
  if (chronicAvg > 0) {
    const acwr = acuteAvg / chronicAvg;
    if (acwr > 1.5) {
      flags.push(`ACWR ${acwr.toFixed(2)}`);
      score -= 25;
    } else if (acwr > 1.3) {
      flags.push(`ACWR moderado ${acwr.toFixed(2)}`);
      score -= 10;
    }
  }

  const recentWellness = bemEstar
    .filter((b) => b.jogador_id === player.id)
    .sort((a, b) => b.data.getTime() - a.data.getTime())[0];

  if (recentWellness) {
    const stress = recentWellness.nivel_stress ?? 0;
    const sono = recentWellness.qual_sono ?? 0;
    if (stress > 7) {
      flags.push('Stress elevado');
      score -= 10;
    }
    if (sono < 4) {
      flags.push('Sono baixo');
      score -= 10;
    }
  }

  score = Math.max(0, Math.min(100, score));
  return {
    jogadorId: player.id,
    name: player.nickname || player.name,
    score,
    flags,
  };
}

function sessionFromScore(teamScore: number, alerts: InterpretiveAlert[]): {
  sessionRecommendation: 'light' | 'moderate' | 'hard';
  sessionRationale: string;
} {
  const hasRed = alerts.some((a) => a.risk === 'red');
  const hasYellow = alerts.some((a) => a.risk === 'yellow');

  if (teamScore < 50 || hasRed) {
    return {
      sessionRecommendation: 'light',
      sessionRationale: 'Equipe com indicadores de risco elevados — priorizar recuperação e carga reduzida.',
    };
  }
  if (teamScore < 75 || hasYellow) {
    return {
      sessionRecommendation: 'moderate',
      sessionRationale: 'Carga moderada recomendada — monitorar atletas sinalizados individualmente.',
    };
  }
  return {
    sessionRecommendation: 'hard',
    sessionRationale: 'Indicadores dentro do esperado — sessão pode seguir plano normal.',
  };
}

export async function getTeamReadiness(tenantInfo: TenantInfo): Promise<TeamReadinessResult> {
  const ctx = await loadTeamContext(tenantInfo);
  const alerts = buildInterpretiveAlerts(ctx);
  const playersAtRisk = ctx.players
    .filter((p) => !p.isTransferred)
    .map((p) => computePlayerReadiness(p, ctx))
    .filter((p) => p.score < 70 || p.flags.length > 0)
    .sort((a, b) => a.score - b.score);

  const activePlayers = ctx.players.filter((p) => !p.isTransferred);
  const teamScore =
    activePlayers.length > 0
      ? Math.round(
          activePlayers.reduce((sum, p) => sum + computePlayerReadiness(p, ctx).score, 0) /
            activePlayers.length
        )
      : 0;

  const { sessionRecommendation, sessionRationale } = sessionFromScore(teamScore, alerts);

  const pseVals: number[] = ctx.pseTreinos.map((r) => r.valor);
  ctx.pseJogos.forEach((r) => pseVals.push(r.valor));
  const avgPse = teamAvg(pseVals.filter((v) => v >= 0 && v <= 10));

  const sleepVals = ctx.qualidadeSono.map((r) => r.valor).filter((v) => v >= 1 && v <= 5);
  const avgSleep = teamAvg(sleepVals);

  return {
    teamScore,
    sessionRecommendation,
    sessionRationale,
    alerts,
    playersAtRisk: playersAtRisk.slice(0, 10),
    avgSleep,
    avgPse,
  };
}

export async function getPreMatchBriefing(tenantInfo: TenantInfo) {
  const equipeIds = requireEquipeIds(tenantInfo);
  const today = new Date(formatDate(new Date()) + 'T12:00:00.000Z');
  const in7days = new Date(today);
  in7days.setDate(in7days.getDate() + 7);

  const [nextChampMatch, readiness, roster] = await Promise.all([
    prisma.campeonatosJogos.findFirst({
      where: {
        campeonato: { equipeId: { in: equipeIds } },
        data: { gte: today, lte: in7days },
      },
      orderBy: { data: 'asc' },
    }),
    getTeamReadiness(tenantInfo),
    getRosterStatus(tenantInfo),
  ]);

  const injured = roster.filter((r) => r.status === 'injured');
  const available = roster.filter((r) => r.status === 'available');

  return {
    date: formatDate(new Date()),
    nextMatch: nextChampMatch
      ? {
          date: formatDate(nextChampMatch.data),
          time: nextChampMatch.horario,
          opponent: nextChampMatch.adversario,
          competition: nextChampMatch.competicao,
          location: nextChampMatch.local,
        }
      : null,
    readiness,
    rosterSummary: {
      available: available.length,
      injured: injured.length,
      injuredNames: injured.slice(0, 5).map((r) => r.name),
    },
    topAlerts: readiness.alerts.filter((a) => a.risk !== 'green').slice(0, 5),
  };
}

export async function getRosterStatus(tenantInfo: TenantInfo): Promise<RosterPlayerStatus[]> {
  const players = await playersService.getAll(tenantInfo);
  return players.map((p) => {
    if (p.isTransferred) {
      return {
        id: p.id,
        name: p.name,
        nickname: p.nickname,
        position: p.position,
        status: 'transferred' as const,
      };
    }
    const activeInj = p.injuryHistory?.find((inj) => !inj.endDate);
    if (activeInj) {
      return {
        id: p.id,
        name: p.name,
        nickname: p.nickname,
        position: p.position,
        status: 'injured' as const,
        activeInjury: `${activeInj.type || 'Lesão'} — ${activeInj.location || ''}`.trim(),
      };
    }
    return {
      id: p.id,
      name: p.name,
      nickname: p.nickname,
      position: p.position,
      status: 'available' as const,
    };
  });
}

export async function getMatchHistory(
  tenantInfo: TenantInfo,
  options?: { limit?: number }
): Promise<MatchHistoryResult> {
  const equipeIds = requireEquipeIds(tenantInfo);
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);

  const rows = await prisma.jogo.findMany({
    where: { equipeId: { in: equipeIds } },
    orderBy: { data: 'desc' },
    take: limit,
    include: {
      competicao: { select: { nome: true } },
      estatisticasJogador: {
        where: { gols: { gt: 0 } },
        orderBy: { gols: 'desc' },
        take: 1,
        include: { jogador: { select: { nome: true, apelido: true } } },
      },
    },
  });

  let wins = 0;
  let draws = 0;
  let losses = 0;

  const matches: MatchHistoryItem[] = rows.map((match) => {
    const r = match.resultado;
    if (r === 'V') wins += 1;
    else if (r === 'E') draws += 1;
    else if (r === 'D') losses += 1;

    const top = match.estatisticasJogador[0];
    return {
      id: match.id,
      date: formatDate(match.data),
      opponent: match.adversario,
      result: match.resultado,
      goalsFor: match.golsPro,
      goalsAgainst: match.golsContra,
      competition: match.campeonato || match.competicao?.nome || null,
      location: match.local,
      topScorer: top
        ? { name: top.jogador.apelido || top.jogador.nome, goals: top.gols }
        : null,
    };
  });

  return {
    total: matches.length,
    record: { wins, draws, losses },
    matches,
  };
}

export async function getLastMatchSummary(tenantInfo: TenantInfo) {
  const equipeIds = requireEquipeIds(tenantInfo);
  const match = await prisma.jogo.findFirst({
    where: { equipeId: { in: equipeIds } },
    orderBy: { data: 'desc' },
    include: {
      estatisticasEquipe: true,
      estatisticasJogador: { include: { jogador: { select: { nome: true, apelido: true } } } },
      competicao: { select: { nome: true } },
    },
  });

  if (!match) return { match: null };

  const stats = match.estatisticasEquipe;
  const topScorers = match.estatisticasJogador
    .filter((s) => s.gols > 0)
    .sort((a, b) => b.gols - a.gols)
    .slice(0, 5)
    .map((s) => ({
      name: s.jogador.apelido || s.jogador.nome,
      goals: s.gols,
      assists: s.assistencias,
    }));

  return {
    match: {
      id: match.id,
      date: formatDate(match.data),
      opponent: match.adversario,
      result: match.resultado,
      competition: match.competicao?.nome || null,
      videoUrl: match.videoUrl,
      teamStats: stats
        ? {
            goalsFor: stats.golsMarcadosJogoAberto + stats.golsMarcadosBolaParada,
            goalsAgainst: stats.golsSofridosJogoAberto + stats.golsSofridosBolaParada,
            shotsOnTarget: stats.chutesNoGol,
            tackles: stats.desarmesComBola + stats.desarmesSemBola,
          }
        : null,
      topScorers,
    },
  };
}

export async function getPlayerStatus(tenantInfo: TenantInfo, jogadorId: string) {
  const player = await playersService.getById(jogadorId, tenantInfo);
  const ctx = await loadTeamContext(tenantInfo);
  const readiness = computePlayerReadiness(player, ctx);

  const recentPse = [
    ...ctx.pseTreinos.filter((r) => r.jogadorId === jogadorId).slice(-5),
    ...ctx.pseJogos.filter((r) => r.jogadorId === jogadorId).slice(-3),
  ].map((r) => ({
    type: 'valor' in r && 'jogoId' in r ? 'jogo' : 'treino',
    value: r.valor,
    date: 'data' in r ? formatDate(r.data) : formatDate((r as { jogo: { data: Date } }).jogo.data),
  }));

  const goalInsights = computeGoalInsights(player.id, ctx.matches);

  return {
    player: {
      id: player.id,
      name: player.name,
      nickname: player.nickname,
      position: player.position,
      jerseyNumber: player.jerseyNumber,
    },
    readiness,
    injuries: player.injuryHistory?.filter((inj) => !inj.endDate) ?? [],
    recentPse,
    goalInsights,
  };
}

function computeGoalInsights(
  jogadorId: string,
  matches: Awaited<ReturnType<typeof loadTeamContext>>['matches']
) {
  const periodCount = new Array<number>(GOAL_BY_PERIOD_LABELS.length).fill(0);
  const methodCount: Record<string, number> = {};
  const originCount: Record<string, number> = {};
  let totalGoals = 0;

  matches.forEach((match) => {
    const log = (match.postMatchEventLog as unknown[]) || [];
    log.forEach((raw) => {
      const ev = raw as {
        playerId?: string;
        action?: string;
        isOpponentGoal?: boolean;
        time?: string;
        period?: string;
        goalMethod?: string;
        subtipo?: string;
      };
      if (String(ev.playerId) !== String(jogadorId) || ev.action !== 'goal' || ev.isOpponentGoal) return;
      totalGoals += 1;
      const m = (ev.goalMethod || ev.subtipo || 'Não informado').trim();
      methodCount[m] = (methodCount[m] || 0) + 1;
      const normalized = m.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase();
      const isSetPiece = SET_PIECE_METHODS.some((sp) =>
        normalized.includes(sp.normalize('NFD').replace(/\p{M}/gu, ''))
      );
      const o = isSetPiece ? 'Bola Parada' : 'Bola Rolando';
      originCount[o] = (originCount[o] || 0) + 1;
    });
  });

  const maxOf = (obj: Record<string, number>) =>
    Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const maxVal = periodCount.length ? Math.max(...periodCount) : 0;
  const maxIdx = periodCount.findIndex((v) => v === maxVal);

  return {
    totalGoals,
    bestPeriod: maxVal > 0 && maxIdx >= 0 ? GOAL_BY_PERIOD_LABELS[maxIdx] : '—',
    topMethod: maxOf(methodCount),
    topOrigin: maxOf(originCount),
  };
}

export async function getWellnessEngagement(tenantInfo: TenantInfo): Promise<WellnessEngagementAlert[]> {
  const ctx = await loadTeamContext(tenantInfo);
  const TOL = 0.35;
  const out: WellnessEngagementAlert[] = [];

  const dims: { key: string; field: keyof typeof ctx.bemEstar[0]; label: string }[] = [
    { key: 'stress', field: 'nivel_stress', label: 'Stress' },
    { key: 'sono', field: 'qual_sono', label: 'Sono' },
    { key: 'humor', field: 'humor_mot', label: 'Humor' },
    { key: 'dor', field: 'dor_muscular', label: 'Dor muscular' },
    { key: 'satisfacao', field: 'satisfacao', label: 'Satisfação' },
  ];

  dims.forEach(({ key, field, label }) => {
    const vals = ctx.bemEstar
      .map((b) => b[field])
      .filter((v): v is number => typeof v === 'number');
    const avg = teamAvg(vals);
    if (avg == null) return;

    const ideal = WELLNESS_IDEAL[key] ?? 3;
    const diff = avg - ideal;
    const absDiff = Math.abs(diff);
    if (absDiff < TOL) return;

    const lowerBetter = LOWER_IS_BETTER.has(key);
    const worse = lowerBetter ? diff > 0 : diff < 0;
    if (!worse) return;

    let severity: WellnessEngagementAlert['severity'] = 'info';
    if (absDiff >= 1.5) severity = 'critical';
    else if (absDiff >= 0.85) severity = 'warning';

    const message = lowerBetter
      ? `Equipe — ${label}: média ${avg} (meta ${ideal}). Acima do bem-estar ideal.`
      : `Equipe — ${label}: média ${avg} (meta ${ideal}). Abaixo do bem-estar ideal.`;

    out.push({ dimension: key, severity, message });
  });

  const order = { critical: 0, warning: 1, info: 2 };
  out.sort((a, b) => order[a.severity] - order[b.severity]);
  return out;
}

export async function getQueryDataPack(tenantInfo: TenantInfo) {
  const [readiness, briefing, roster, lastMatch, matchHistory, wellnessEngagement, opponents] =
    await Promise.all([
    getTeamReadiness(tenantInfo),
    getPreMatchBriefing(tenantInfo),
    getRosterStatus(tenantInfo),
    getLastMatchSummary(tenantInfo),
    getMatchHistory(tenantInfo),
    getWellnessEngagement(tenantInfo),
    listOpponentsWithSeed(tenantInfo).catch(() => null),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    readiness,
    briefing,
    roster,
    lastMatch,
    matchHistory,
    wellnessEngagement,
    opponents: opponents
      ? { total: opponents.total, items: opponents.opponents.slice(0, 12) }
      : null,
  };
}

export async function getPendingWellnessPlayers(tenantInfo: TenantInfo) {
  const equipeIds = requireEquipeIds(tenantInfo);
  const today = new Date(formatDate(new Date()) + 'T12:00:00.000Z');
  const players = await playersService.getAll(tenantInfo);
  const active = players.filter((p) => !p.isTransferred);

  const [filledToday] = await Promise.all([
    prisma.bem_estar_diario.findMany({
      where: { equipe_id: { in: equipeIds }, data: today },
      select: { jogador_id: true },
    }),
  ]);

  const filledIds = new Set(filledToday.map((b) => b.jogador_id));
  return active
    .filter((p) => !filledIds.has(p.id))
    .map((p) => ({ id: p.id, name: p.nickname || p.name }));
}

export { STAFF_ROLES };
