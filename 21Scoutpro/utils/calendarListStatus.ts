import {
  collectedMatchScore,
  fixtureDetailKey,
  sameFixtureBase,
  selectSavedForFixture,
  type CollectedMatchRef,
  type FixtureIdentity,
  type FixtureLinkOptions,
} from './reopenRealtimeCollection';

export interface CalendarSavedMatch {
  id?: string;
  date?: string;
  opponent?: string;
  competition?: string;
  time?: string;
  kickoffTime?: string;
  status?: string;
  goalsFor?: number;
  postMatchEventCount?: number;
  postMatchEventLog?: unknown[] | null;
  lineup?: {
    clockSnapshot?: { state?: string };
    kickoffTime?: string;
    players?: string[];
    selectedPlayerIds?: string[];
  } | null;
}

export interface CalendarAgendaMatch {
  id?: string;
  date?: string;
  opponent?: string;
  competition?: string;
  time?: string;
  jogoId?: string | null;
}

function eventCount(match: CalendarSavedMatch): number {
  if (Array.isArray(match.postMatchEventLog)) return match.postMatchEventLog.length;
  return match.postMatchEventCount ?? 0;
}

type SheetStats = {
  goals?: number;
  goalsConceded?: number;
  assists?: number;
  passesCorrect?: number;
  passesWrong?: number;
  shotsOnTarget?: number;
  shotsOffTarget?: number;
  tacklesWithBall?: number;
  tacklesWithoutBall?: number;
  tacklesCounterAttack?: number;
  transitionErrors?: number;
};

export type CalendarBadgeMatch = CalendarSavedMatch & {
  teamStats?: SheetStats | null;
  playerStats?: Record<string, unknown> | null;
};

export type CalendarBadge = 'disponivel' | 'incompleto' | 'finalizado';

/** Fita, relógio fora do pré-jogo, ou estatística já lançada. */
export function hasCollectedMatchSignals(match: CalendarBadgeMatch): boolean {
  if (eventCount(match) > 0) return true;
  const clockState = match.lineup?.clockSnapshot?.state;
  if (clockState && clockState !== 'PRE_JOGO') return true;
  const stats = match.teamStats;
  if (
    stats &&
    ((stats.goals ?? 0) > 0 ||
      (stats.goalsConceded ?? 0) > 0 ||
      (stats.assists ?? 0) > 0 ||
      (stats.passesCorrect ?? 0) > 0 ||
      (stats.passesWrong ?? 0) > 0 ||
      (stats.shotsOnTarget ?? 0) > 0 ||
      (stats.shotsOffTarget ?? 0) > 0 ||
      (stats.tacklesWithBall ?? 0) > 0 ||
      (stats.tacklesWithoutBall ?? 0) > 0 ||
      (stats.tacklesCounterAttack ?? 0) > 0 ||
      (stats.transitionErrors ?? 0) > 0)
  ) {
    return true;
  }
  return Object.keys(match.playerStats || {}).length > 0;
}

function hasLegacySheetStats(match: CalendarBadgeMatch): boolean {
  const stats = match.teamStats;
  if (!stats) return false;
  const untouched =
    stats.goals === 0 &&
    stats.assists === 0 &&
    stats.passesCorrect === 0 &&
    stats.passesWrong === 0 &&
    stats.shotsOnTarget === 0 &&
    stats.shotsOffTarget === 0 &&
    stats.tacklesWithBall === 0 &&
    stats.tacklesWithoutBall === 0 &&
    stats.tacklesCounterAttack === 0 &&
    stats.transitionErrors === 0 &&
    Object.keys(match.playerStats || {}).length === 0;
  return !untouched;
}

/**
 * Selo do calendário. Sem fita, sem relógio e sem estatística não é incompleto.
 * Coleta em andamento continua incompleta. Encerrado continua finalizado.
 */
export function calendarBadgeForSavedMatch(match: CalendarBadgeMatch): CalendarBadge {
  if (collectionCountsAsFinalized(match)) return 'finalizado';
  if (match.status === 'disponivel' || match.status === 'nao_executado') return 'disponivel';
  if (match.status === 'em_andamento') {
    return hasCollectedMatchSignals(match) ? 'incompleto' : 'disponivel';
  }
  if (match.status === 'encerrado') return 'finalizado';
  if (match.status == null && !hasLegacySheetStats(match)) return 'disponivel';
  return 'finalizado';
}

/** Card da agenda sem coleta vinculada permanece disponível, mesmo depois do horário. */
export function calendarBadgeForScheduled(linkedSaved: CalendarBadgeMatch | null | undefined): CalendarBadge {
  if (!linkedSaved) return 'disponivel';
  return calendarBadgeForSavedMatch(linkedSaved);
}

/**
 * Coleta já encerrada no relógio, mesmo se a coluna status ficou `disponivel`.
 * `em_andamento` explícito continua incompleto: o técnico ainda não finalizou.
 */
export function collectionCountsAsFinalized(match: CalendarSavedMatch): boolean {
  if (match.status === 'encerrado') return true;
  if (match.status === 'em_andamento') return false;
  return match.lineup?.clockSnapshot?.state === 'ENCERRADO' && eventCount(match) > 0;
}

/**
 * Esconde o jogo vazio quando a coleta do mesmo horário já existe.
 * Outro horário no mesmo dia contra o mesmo adversário permanece.
 */
export function dropUncollectedFixtureShells<T extends CalendarSavedMatch>(matches: T[]): T[] {
  return matches.filter((match) => {
    if (collectedMatchScore(match as CollectedMatchRef) > 0) return true;
    const detail = fixtureDetailKey(match);
    if (!detail) return true;
    const collectedSibling = matches.some((other) => {
      if (other === match) return false;
      if (collectedMatchScore(other as CollectedMatchRef) <= 0) return false;
      return sameFixtureBase(other, match) && fixtureDetailKey(other) === detail;
    });
    return !collectedSibling;
  });
}

/** Partida salva do card. jogoId primeiro; sem hora segura, não esconde o card. */
export function findSavedMatchForAgenda<T extends CalendarSavedMatch>(
  scheduled: CalendarAgendaMatch,
  matches: T[],
  agendas?: CalendarAgendaMatch[]
): T | null {
  const fixture: FixtureIdentity = {
    date: String(scheduled.date || ''),
    opponent: String(scheduled.opponent || ''),
    competition: scheduled.competition,
    time: scheduled.time,
    jogoId: scheduled.jogoId,
  };
  const options: FixtureLinkOptions | undefined = agendas ? { scheduled: agendas } : undefined;
  return selectSavedForFixture(fixture, matches as unknown as CollectedMatchRef[], options) as T | null;
}
