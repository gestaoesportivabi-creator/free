import { fixtureKey, collectedMatchScore, findCollectedMatchForFixture, type CollectedMatchRef } from './reopenRealtimeCollection';

export interface CalendarSavedMatch {
  id?: string;
  date?: string;
  opponent?: string;
  competition?: string;
  status?: string;
  goalsFor?: number;
  postMatchEventCount?: number;
  postMatchEventLog?: unknown[] | null;
  lineup?: { clockSnapshot?: { state?: string } } | null;
}

export interface CalendarAgendaMatch {
  id?: string;
  date?: string;
  opponent?: string;
  competition?: string;
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
 * Esconde o jogo vazio (status disponível, sem fita) quando já existe a coleta
 * da mesma data e adversário. Dois jogos com eventos no mesmo confronto ficam.
 */
export function dropUncollectedFixtureShells<T extends CalendarSavedMatch>(matches: T[]): T[] {
  return matches.filter((match) => {
    if (collectedMatchScore(match as CollectedMatchRef) > 0) return true;
    const key = fixtureKey(match.date, match.opponent);
    if (!key) return true;
    const competition = String(match.competition || '').trim().toLowerCase();
    const collectedSibling = matches.some((other) => {
      if (other === match) return false;
      if (fixtureKey(other.date, other.opponent) !== key) return false;
      if (collectedMatchScore(other as CollectedMatchRef) <= 0) return false;
      const otherCompetition = String(other.competition || '').trim().toLowerCase();
      if (competition && otherCompetition && competition !== otherCompetition) return false;
      return true;
    });
    return !collectedSibling;
  });
}

/** Partida salva que representa o card da agenda. Prefere a coleta de verdade. */
export function findSavedMatchForAgenda<T extends CalendarSavedMatch>(
  scheduled: CalendarAgendaMatch,
  matches: T[]
): T | null {
  if (scheduled.jogoId) {
    const byId = matches.find((match) => String(match.id || '') === String(scheduled.jogoId));
    if (byId) return byId;
  }
  const collected = findCollectedMatchForFixture(matches as unknown as CollectedMatchRef[], {
    date: String(scheduled.date || ''),
    opponent: String(scheduled.opponent || ''),
    competition: scheduled.competition,
  });
  if (collected) return collected as T;
  const key = fixtureKey(scheduled.date, scheduled.opponent);
  if (!key) return null;
  const competition = String(scheduled.competition || '').trim().toLowerCase();
  return (
    matches.find((match) => {
      if (fixtureKey(match.date, match.opponent) !== key) return false;
      if (!competition || !match.competition) return true;
      return String(match.competition).trim().toLowerCase() === competition;
    }) ?? null
  );
}
