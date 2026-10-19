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
  lineup?: { clockSnapshot?: { state?: string }; kickoffTime?: string } | null;
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
