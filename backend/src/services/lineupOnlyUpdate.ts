/**
 * O PUT de antes do relógio manda `lineupOnly: true`. Só nesse caso o
 * backend pula placar, resultado e estatística. Um 0x0 sem a flag é correção
 * e grava. Encerrado e clockSnapshot ficam com statusToPersist e
 * mergeLineupPreservingClockSnapshot.
 */

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
  /** Só o PUT de escalação, antes do relógio. Ausente: grava placar e estatística. */
  lineupOnly?: boolean;
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

/** Verdadeiro só quando o cliente declara que este PUT é só escalação. */
export function isLineupOnlyWrite(incoming: LineupPutIncoming): boolean {
  return incoming.lineupOnly === true;
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
