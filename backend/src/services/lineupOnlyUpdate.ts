/**
 * PUT que só traz escalação não pode zerar placar, resultado ou estatística
 * de um jogo que já os tenha. Encerrado e clockSnapshot ficam com as regras
 * que já existem (statusToPersist e mergeLineupPreservingClockSnapshot).
 */

const CORE_STAT_KEYS = [
  'goals',
  'goalsConceded',
  'assists',
  'passesCorrect',
  'passesWrong',
  'shotsOnTarget',
  'shotsOffTarget',
  'tacklesWithBall',
  'tacklesWithoutBall',
  'tacklesCounterAttack',
  'transitionErrors',
  'gols',
  'golsSofridos',
  'assistencias',
  'passesCorretos',
  'passesErrados',
] as const;

export interface LineupPutExisting {
  resultado?: string | null;
  golsPro?: number | null;
  golsContra?: number | null;
}

export interface LineupPutIncoming {
  result?: string | null;
  resultado?: string | null;
  goalsFor?: number | null;
  goalsAgainst?: number | null;
  golsPro?: number | null;
  golsContra?: number | null;
  teamStats?: Record<string, unknown> | null;
  playerStats?: Record<string, unknown> | null;
  postMatchEventLog?: unknown;
  eventLogWriteMode?: unknown;
  lineup?: unknown;
}

export interface LineupPutResolution {
  lineupOnly: boolean;
  golsPro: number;
  golsContra: number;
  /** Ausente: não gravar a coluna. */
  resultado?: string;
  applyTeamStats: boolean;
  applyPlayerStats: boolean;
}

function hasMeaningfulTeamStats(stats: Record<string, unknown> | null | undefined): boolean {
  if (!stats) return false;
  return CORE_STAT_KEYS.some((key) => {
    const value = Number(stats[key] ?? 0);
    return Number.isFinite(value) && value > 0;
  });
}

/** Escalação sem fita e sem estatística nova. Não é um save da coleta nem da planilha. */
export function isLineupOnlyWrite(incoming: LineupPutIncoming): boolean {
  if (!incoming.lineup || typeof incoming.lineup !== 'object' || Array.isArray(incoming.lineup)) {
    return false;
  }
  if (Array.isArray(incoming.postMatchEventLog) && incoming.postMatchEventLog.length > 0) return false;
  if (incoming.eventLogWriteMode === 'union') return false;
  if (hasMeaningfulTeamStats(incoming.teamStats)) return false;
  if (incoming.playerStats && Object.keys(incoming.playerStats).length > 0) return false;
  return true;
}

export function resolveLineupOnlyUpdate(
  existing: LineupPutExisting,
  incoming: LineupPutIncoming
): LineupPutResolution {
  if (isLineupOnlyWrite(incoming)) {
    return {
      lineupOnly: true,
      golsPro: existing.golsPro ?? 0,
      golsContra: existing.golsContra ?? 0,
      applyTeamStats: false,
      applyPlayerStats: false,
    };
  }

  const resultado = String(incoming.resultado ?? incoming.result ?? '').trim();
  return {
    lineupOnly: false,
    golsPro: incoming.golsPro ?? incoming.goalsFor ?? existing.golsPro ?? 0,
    golsContra: incoming.golsContra ?? incoming.goalsAgainst ?? existing.golsContra ?? 0,
    ...(resultado ? { resultado } : {}),
    applyTeamStats: Boolean(incoming.teamStats),
    applyPlayerStats: Boolean(incoming.playerStats && Object.keys(incoming.playerStats).length > 0),
  };
}
