import type { MatchRecord } from '../types';

const ZERO_STATS = {
  goals: 0,
  assists: 0,
  passesCorrect: 0,
  passesWrong: 0,
  shotsOnTarget: 0,
  shotsOffTarget: 0,
  tacklesWithBall: 0,
  tacklesWithoutBall: 0,
  tacklesCounterAttack: 0,
  transitionErrors: 0,
} as const;

function uniqueIds(ids: Array<string | undefined | null>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of ids) {
    const id = String(raw ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Escalação gravada antes do relógio. Encerrado não regride.
 * Em andamento também não: um PUT `disponivel` rebaixaria a coluna.
 * Qualquer outro status fica disponível — sem fita, sem relógio e sem estatística.
 */
export function statusForLineupDraft(
  current: MatchRecord['status'] | undefined
): 'disponivel' | 'em_andamento' | 'encerrado' {
  if (current === 'encerrado') return 'encerrado';
  if (current === 'em_andamento') return 'em_andamento';
  return 'disponivel';
}

/** Só a escalação inicial, antes de confirmar posse e iniciar o relógio. */
export function shouldPersistStartingLineup(input: {
  isPostmatch: boolean;
  isMatchStarted: boolean;
  eventCount: number;
  playerCount: number;
  alreadySaved: boolean;
}): boolean {
  if (input.isPostmatch || input.isMatchStarted || input.eventCount > 0) return false;
  if (input.playerCount === 5) return true;
  return input.alreadySaved && input.playerCount >= 0 && input.playerCount < 5;
}

/** Atletas da Preparação: convocados, ou os titulares se só eles foram gravados. */
export function prepSquadIdsFromLineup(
  lineup?: { players?: string[]; selectedPlayerIds?: string[] } | null
): string[] {
  const selected = uniqueIds(lineup?.selectedPlayerIds ?? []);
  if (selected.length > 0) return selected;
  return uniqueIds(lineup?.players ?? []);
}

export interface StartingLineupSaveInput {
  matchId: string;
  opponent: string;
  date: string;
  competition?: string;
  location?: string;
  status?: MatchRecord['status'];
  collectionPhase?: 0 | 1 | 2;
  players: string[];
  bench: string[];
  selectedPlayerIds?: string[];
  previousSelectedPlayerIds?: string[];
  kickoffTime?: string;
  technicalAnalysis?: NonNullable<MatchRecord['lineup']>['technicalAnalysis'];
}

/**
 * Payload da escalação sem relógio e sem fita.
 * Não manda clockSnapshot: PRE_JOGO não pode virar sinal de coleta.
 */
export function buildStartingLineupSave(input: StartingLineupSaveInput): MatchRecord {
  const players = uniqueIds(input.players);
  const bench = uniqueIds(input.bench).filter((id) => !players.includes(id));
  const selectedPlayerIds = uniqueIds([
    ...players,
    ...bench,
    ...(input.selectedPlayerIds ?? []),
    ...(input.previousSelectedPlayerIds ?? []),
  ]);
  const kickoffTime = String(input.kickoffTime || '').trim();
  const lineup = {
    players,
    bench,
    ...(selectedPlayerIds.length > 0 ? { selectedPlayerIds } : {}),
    ...(kickoffTime ? { kickoffTime } : {}),
    ...(input.technicalAnalysis ? { technicalAnalysis: input.technicalAnalysis } : {}),
  } as MatchRecord['lineup'];

  const phase = input.collectionPhase;
  return {
    id: input.matchId,
    opponent: input.opponent,
    date: input.date,
    competition: input.competition,
    location: input.location,
    status: statusForLineupDraft(input.status),
    result: 'E',
    goalsFor: 0,
    goalsAgainst: 0,
    playerStats: {},
    teamStats: { ...ZERO_STATS },
    ...(phase === 1 || phase === 2 ? { collectionPhase: phase } : { collectionPhase: 0 as const }),
    lineup,
  };
}
