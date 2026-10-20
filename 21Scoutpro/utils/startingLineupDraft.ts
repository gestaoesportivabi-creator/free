import type { MatchRecord } from '../types';

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

/** Escolha manual na Preparação: grava a partir do primeiro atleta, e também o esvaziar depois disso. */
export function shouldPersistPrepSelection(input: {
  selectedCount: number;
  alreadySaved: boolean;
}): boolean {
  if (input.selectedCount > 0) return true;
  return input.alreadySaved;
}

/** Atletas da Preparação: convocados, ou os titulares se só eles foram gravados. */
export function prepSquadIdsFromLineup(
  lineup?: { players?: readonly string[]; selectedPlayerIds?: readonly string[] } | null
): string[] {
  const selected = uniqueIds([...(lineup?.selectedPlayerIds ?? [])]);
  if (selected.length > 0) return selected;
  return uniqueIds([...(lineup?.players ?? [])]);
}

/** Assinatura estável da escolha manual, para não regravar o mesmo elenco. */
export function prepSelectionSignature(ids: Iterable<string>): string {
  return uniqueIds([...ids]).sort().join('|');
}

export interface LineupDraftLineup {
  players: string[];
  bench: string[];
  selectedPlayerIds?: string[];
  kickoffTime?: string;
  ballPossessionStart?: 'us' | 'opponent';
  technicalAnalysis?: NonNullable<MatchRecord['lineup']>['technicalAnalysis'];
}

/**
 * PUT da escalação, antes do relógio. Sem placar, resultado ou estatística.
 * `lineupOnly` é o único sinal para o backend não gravar esses campos.
 */
export interface LineupDraftRecord {
  id: string;
  opponent: string;
  date: string;
  competition?: string;
  location?: string;
  status: 'disponivel' | 'em_andamento' | 'encerrado';
  collectionPhase?: 1 | 2;
  lineupOnly: true;
  lineup: LineupDraftLineup;
}

const SCORE_FIELDS = [
  'result',
  'resultado',
  'goalsFor',
  'goalsAgainst',
  'golsPro',
  'golsContra',
  'teamStats',
  'playerStats',
] as const;

export function lineupDraftHasScoreFields(payload: object): boolean {
  return SCORE_FIELDS.some((key) => Object.prototype.hasOwnProperty.call(payload, key));
}

function draftPhase(phase: 0 | 1 | 2 | undefined): 1 | 2 | undefined {
  if (phase === 1 || phase === 2) return phase;
  return undefined;
}

function lineupWithoutScore(input: {
  players: string[];
  bench: string[];
  selectedPlayerIds: string[];
  kickoffTime?: string;
  ballPossessionStart?: 'us' | 'opponent';
  technicalAnalysis?: LineupDraftLineup['technicalAnalysis'];
}): LineupDraftLineup {
  const kickoffTime = String(input.kickoffTime || '').trim();
  return {
    players: input.players,
    bench: input.bench,
    ...(input.selectedPlayerIds.length > 0 ? { selectedPlayerIds: input.selectedPlayerIds } : {}),
    ...(kickoffTime ? { kickoffTime } : {}),
    ...(input.ballPossessionStart ? { ballPossessionStart: input.ballPossessionStart } : {}),
    ...(input.technicalAnalysis ? { technicalAnalysis: input.technicalAnalysis } : {}),
  };
}

function draftEnvelope(input: {
  matchId: string;
  opponent: string;
  date: string;
  competition?: string;
  location?: string;
  status?: MatchRecord['status'];
  collectionPhase?: 0 | 1 | 2;
  lineup: LineupDraftLineup;
}): LineupDraftRecord {
  const phase = draftPhase(input.collectionPhase);
  return {
    id: input.matchId,
    opponent: input.opponent,
    date: input.date,
    competition: input.competition,
    location: input.location,
    status: statusForLineupDraft(input.status),
    lineupOnly: true,
    ...(phase ? { collectionPhase: phase } : {}),
    lineup: input.lineup,
  };
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
  ballPossessionStart?: 'us' | 'opponent';
  technicalAnalysis?: LineupDraftLineup['technicalAnalysis'];
}

/**
 * Payload da escalação sem relógio e sem fita.
 * Não manda placar, resultado, estatística nem clockSnapshot.
 */
export function buildStartingLineupSave(input: StartingLineupSaveInput): LineupDraftRecord {
  const players = uniqueIds(input.players);
  const explicit = uniqueIds(input.selectedPlayerIds ?? []);
  const previous = uniqueIds(input.previousSelectedPlayerIds ?? []);
  const convocation = explicit.length > 0 ? explicit : previous;
  let bench = uniqueIds(input.bench).filter((id) => !players.includes(id));
  const selectedPlayerIds = convocation.length > 0
    ? convocation
    : uniqueIds([...players, ...bench]);
  if (convocation.length > 0) {
    const allowed = new Set(convocation);
    bench = bench.filter((id) => allowed.has(id));
  }
  return draftEnvelope({
    ...input,
    lineup: lineupWithoutScore({
      players,
      bench,
      selectedPlayerIds,
      kickoffTime: input.kickoffTime,
      ballPossessionStart: input.ballPossessionStart,
      technicalAnalysis: input.technicalAnalysis,
    }),
  });
}

export interface PrepSelectionSaveInput {
  matchId: string;
  opponent: string;
  date: string;
  competition?: string;
  location?: string;
  status?: MatchRecord['status'];
  collectionPhase?: 0 | 1 | 2;
  selectedPlayerIds: string[];
  kickoffTime?: string;
  existingLineup?: {
    players?: string[];
    bench?: string[];
    kickoffTime?: string;
    ballPossessionStart?: 'us' | 'opponent';
    technicalAnalysis?: LineupDraftLineup['technicalAnalysis'];
  } | null;
}

/**
 * Escolha manual da Preparação. Mantém titulares já gravados e troca só os convocados.
 */
export function buildPrepSelectionSave(input: PrepSelectionSaveInput): LineupDraftRecord {
  const existing = input.existingLineup;
  const players = uniqueIds(existing?.players ?? []);
  const bench = uniqueIds(existing?.bench ?? []).filter((id) => !players.includes(id));
  return draftEnvelope({
    matchId: input.matchId,
    opponent: input.opponent,
    date: input.date,
    competition: input.competition,
    location: input.location,
    status: input.status,
    collectionPhase: input.collectionPhase,
    lineup: lineupWithoutScore({
      players,
      bench,
      selectedPlayerIds: uniqueIds(input.selectedPlayerIds),
      kickoffTime: input.kickoffTime || existing?.kickoffTime,
      ballPossessionStart: existing?.ballPossessionStart,
      technicalAnalysis: existing?.technicalAnalysis,
    }),
  });
}
