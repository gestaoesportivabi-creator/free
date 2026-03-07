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
  possessionSecondsWith?: number;
  possessionSecondsWithout?: number;
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
  return {
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

  // Formatar data para string YYYY-MM-DD
  const dateStr = typeof jogo.data === 'string' 
    ? jogo.data 
    : jogo.data.toISOString().split('T')[0];

  const result: MatchRecord = {
    id: jogo.id,
    opponent: jogo.adversario,
    date: dateStr,
    result: (jogo.resultado as 'V' | 'D' | 'E') || 'E',
    goalsFor: jogo.golsPro,
    goalsAgainst: jogo.golsContra,
    competition: jogo.campeonato || undefined,
    playerStats,
    teamStats,
  };
  if (jogo.postMatchEventLog) result.postMatchEventLog = jogo.postMatchEventLog as MatchRecord['postMatchEventLog'];
  if (jogo.playerRelationships) result.playerRelationships = jogo.playerRelationships as MatchRecord['playerRelationships'];
  if (jogo.lineup) result.lineup = jogo.lineup as MatchRecord['lineup'];
  if (jogo.substitutionHistory) result.substitutionHistory = jogo.substitutionHistory as MatchRecord['substitutionHistory'];
  if (jogo.possessionSecondsWith !== undefined) result.possessionSecondsWith = jogo.possessionSecondsWith;
  if (jogo.possessionSecondsWithout !== undefined) result.possessionSecondsWithout = jogo.possessionSecondsWithout;
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

