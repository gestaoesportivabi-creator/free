/**
 * Adapter para transformar dados de jogos do PostgreSQL para formato MatchRecord do frontend
 * Aplicar ajuste recomendado da Seção 11.2.C (item 13)
 */

import { MatchRecord, MatchStats } from '../types/frontend';

// Tipos do banco de dados (Prisma retorna camelCase)
interface JogoDB {
  id: string;
  equipeId: string;
  adversario: string;
  data: Date | string;
  campeonato?: string | null;
  competicaoId?: string | null;
  local?: string | null;
  resultado?: string | null;
  golsPro: number;
  golsContra: number;
  videoUrl?: string | null;
  postMatchEventLog?: unknown;
  playerRelationships?: unknown;
  lineup?: unknown;
  substitutionHistory?: unknown;
  status?: string | null;
  createdAt: Date | string;
}

interface JogoEstatisticaEquipeDB {
  id: string;
  jogoId: string;
  minutosJogados: number;
  gols: number;
  golsSofridos: number;
  assistencias: number;
  cartoesAmarelos: number;
  cartoesVermelhos: number;
  passesCorretos: number;
  passesErrados: number;
  passesErradosTransicao: number;
  desarmesComBola: number;
  desarmesContraAtaque: number;
  desarmesSemBola: number;
  chutesNoGol: number;
  chutesFora: number;
  rpePartida?: number | null;
  golsMarcadosJogoAberto: number;
  golsMarcadosBolaParada: number;
  golsSofridosJogoAberto: number;
  golsSofridosBolaParada: number;
}

interface JogoEstatisticaJogadorDB {
  id: string;
  jogoId: string;
  jogadorId: string;
  minutosJogados: number;
  gols: number;
  golsSofridos: number;
  assistencias: number;
  cartoesAmarelos: number;
  cartoesVermelhos: number;
  passesCorretos: number;
  passesErrados: number;
  passesErradosTransicao: number;
  desarmesComBola: number;
  desarmesContraAtaque: number;
  desarmesSemBola: number;
  chutesNoGol: number;
  chutesFora: number;
  rpePartida?: number | null;
  golsMarcadosJogoAberto: number;
  golsMarcadosBolaParada: number;
  golsSofridosJogoAberto: number;
  golsSofridosBolaParada: number;
}

/**
 * Transforma estatísticas do banco para formato MatchStats do frontend
 */
function transformStatsToMatchStats(stat: JogoEstatisticaJogadorDB | JogoEstatisticaEquipeDB): MatchStats {
  const base: MatchStats = {
    goals: stat.gols,
    assists: stat.assistencias,
    passesCorrect: stat.passesCorretos,
    passesWrong: stat.passesErrados,
    shotsOnTarget: stat.chutesNoGol,
    shotsOffTarget: stat.chutesFora,
    tacklesWithBall: stat.desarmesComBola,
    tacklesWithoutBall: stat.desarmesSemBola,
    tacklesCounterAttack: stat.desarmesContraAtaque,
    transitionErrors: stat.passesErradosTransicao,
    yellowCards: stat.cartoesAmarelos,
    redCards: stat.cartoesVermelhos,
  };
  if ('minutosJogados' in stat) base.minutesPlayed = stat.minutosJogados;
  if ('golsSofridos' in stat) base.goalsConceded = stat.golsSofridos;
  return base;
}

/**
 * Transforma jogo do banco de dados para formato MatchRecord do frontend
 */
export function transformMatchToFrontend(
  jogo: JogoDB,
  estatisticasJogadores: JogoEstatisticaJogadorDB[],
  estatisticasEquipe?: JogoEstatisticaEquipeDB
): MatchRecord {
  // Transformar playerStats em objeto aninhado por jogadorId
  const playerStats: { [playerId: string]: MatchStats } = {};
  estatisticasJogadores.forEach((stat) => {
    playerStats[stat.jogadorId] = transformStatsToMatchStats(stat);
  });

  // Transformar teamStats
  const teamStats: MatchStats = estatisticasEquipe
    ? transformStatsToMatchStats(estatisticasEquipe)
    : {
        goals: jogo.golsPro,
        goalsConceded: jogo.golsContra,
        minutesPlayed: 40,
        assists: 0,
        passesCorrect: 0,
        passesWrong: 0,
        shotsOnTarget: 0,
        shotsOffTarget: 0,
        tacklesWithBall: 0,
        tacklesWithoutBall: 0,
        tacklesCounterAttack: 0,
        transitionErrors: 0,
      };

  // Formatar data para string YYYY-MM-DD (sem conversão UTC)
  // O PostgreSQL armazena @db.Date como meia-noite UTC, mas representa uma data local.
  // Usando toISOString() o dia pode ficar errado em fusos negativos (ex: Brasil UTC-3).
  let dateStr: string;
  if (typeof jogo.data === 'string') {
    dateStr = jogo.data.slice(0, 10); // 'YYYY-MM-DD' ou 'YYYY-MM-DDT...'
  } else {
    // Date object: extrair componentes SEM converter para UTC
    // Para @db.Date, Prisma entrega Date em UTC meia-noite.
    // Precisamos do valor UTC (que é o dia correto salvo no DB).
    const y = jogo.data.getUTCFullYear();
    const m = String(jogo.data.getUTCMonth() + 1).padStart(2, '0');
    const d = String(jogo.data.getUTCDate()).padStart(2, '0');
    dateStr = `${y}-${m}-${d}`;
  }

  const result: MatchRecord = {
    id: jogo.id,
    opponent: jogo.adversario,
    date: dateStr,
    result: (jogo.resultado as 'V' | 'D' | 'E') || 'E',
    goalsFor: jogo.golsPro,
    goalsAgainst: jogo.golsContra,
    competition: jogo.campeonato || undefined,
    location: (jogo as { local?: string }).local || undefined,
    playerStats,
    teamStats,
    status: (jogo.status as MatchRecord['status']) || 'encerrado',
  };
  if (jogo.postMatchEventLog) result.postMatchEventLog = jogo.postMatchEventLog as MatchRecord['postMatchEventLog'];
  if (jogo.playerRelationships) result.playerRelationships = jogo.playerRelationships as MatchRecord['playerRelationships'];
  if (jogo.lineup) result.lineup = jogo.lineup as MatchRecord['lineup'];
  if (jogo.substitutionHistory) result.substitutionHistory = jogo.substitutionHistory as MatchRecord['substitutionHistory'];

  // Derivar goalTimes e goalsConcededTimes do postMatchEventLog para os gráficos de gols por período
  const eventLog = result.postMatchEventLog;
  if (eventLog && Array.isArray(eventLog)) {
    const goalTimes: Array<{ time: string; method?: string }> = [];
    const goalsConcededTimes: Array<{ time: string; method?: string }> = [];
    for (const ev of eventLog) {
      const e = ev as { action?: string; time?: string; period?: string; isOpponentGoal?: boolean; goalMethod?: string };
      if (e.action !== 'goal' || !e.time) continue;
      const timeStr = typeof e.time === 'string' ? e.time : String(e.time);
      const period = e.period || '1T';
      const entry = { time: `${timeStr} (${period})`, method: e.goalMethod?.trim() || undefined };
      if (e.isOpponentGoal) {
        goalsConcededTimes.push(entry);
      } else {
        goalTimes.push(entry);
      }
    }
    if (goalTimes.length > 0) result.teamStats.goalTimes = goalTimes;
    if (goalsConcededTimes.length > 0) result.teamStats.goalsConcededTimes = goalsConcededTimes;
  }

  return result;
}

/**
 * Transforma array de jogos para formato do frontend
 */
export function transformMatchesToFrontend(
  jogos: JogoDB[],
  estatisticasJogadoresMap: Map<string, JogoEstatisticaJogadorDB[]>,
  estatisticasEquipeMap: Map<string, JogoEstatisticaEquipeDB>
): MatchRecord[] {
  return jogos.map((jogo) => {
    const estatisticasJogadores = estatisticasJogadoresMap.get(jogo.id) || [];
    const estatisticasEquipe = estatisticasEquipeMap.get(jogo.id);
    return transformMatchToFrontend(jogo, estatisticasJogadores, estatisticasEquipe);
  });
}

