import type { MatchRecord } from '../types';
import { isPersistedServerMatchId } from './matchIds';

export interface FixtureIdentity {
  date: string;
  opponent: string;
  competition?: string;
}

export interface CollectedMatchRef {
  id?: string;
  date?: string;
  opponent?: string;
  competition?: string;
  status?: MatchRecord['status'];
  postMatchEventLog?: unknown[] | null;
  postMatchEventCount?: number;
  lineup?: { clockSnapshot?: unknown; selectedPlayerIds?: string[] } | null;
}

/** Data + adversário, sem somar hora e sem diferenciar maiúsculas. */
export function fixtureKey(date: string | undefined, opponent: string | undefined): string {
  const day = String(date || '').trim().slice(0, 10);
  const name = String(opponent || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!day || !name) return '';
  return `${day}_${name}`;
}

export function collectedMatchScore(match: CollectedMatchRef | null | undefined): number {
  if (!match?.id || !isPersistedServerMatchId(String(match.id))) return 0;
  const count = Array.isArray(match.postMatchEventLog)
    ? match.postMatchEventLog.length
    : (match.postMatchEventCount ?? 0);
  const hasClock = Boolean(match.lineup && match.lineup.clockSnapshot);
  let score = 0;
  if (match.status === 'encerrado') score += 8;
  if (match.status === 'em_andamento') score += 4;
  if (count > 0) score += 2;
  if (hasClock) score += 1;
  return score;
}

/** A coleta já existe: eventos, relógio salvo, ou partida em andamento/encerrada. */
export function shouldResumeRealtimeCollection(match: CollectedMatchRef | null | undefined): boolean {
  return collectedMatchScore(match) > 0;
}

/**
 * Acha a coleta já gravada da mesma data e adversário.
 * O id da partida programada (tabela) não é id de jogo e não entra aqui.
 */
export function findCollectedMatchForFixture<T extends CollectedMatchRef>(
  matches: T[],
  fixture: FixtureIdentity
): T | null {
  const key = fixtureKey(fixture.date, fixture.opponent);
  if (!key) return null;
  const competition = String(fixture.competition || '').trim().toLowerCase();
  let best: T | null = null;
  let bestScore = 0;
  for (const match of matches) {
    if (fixtureKey(match.date, match.opponent) !== key) continue;
    if (competition && match.competition) {
      const matchCompetition = String(match.competition).trim().toLowerCase();
      if (matchCompetition && matchCompetition !== competition) continue;
    }
    const score = collectedMatchScore(match);
    if (score > bestScore) {
      best = match;
      bestScore = score;
    }
  }
  return best;
}

export interface RealtimeOpenResolution<T extends CollectedMatchRef> {
  /** Partida de jogo a hidratar. Null = começar coleta nova, sem reutilizar id de agenda. */
  match: T | null;
  /** O id pedido era de agenda/outro recurso: não gravar por cima dele. */
  ignoredForeignId: boolean;
}

/**
 * Decide qual coleta o scout ao vivo abre.
 * Partida encerrada ou em andamento, com fita ou com clockSnapshot, reabre.
 * Id que não é um jogo (404 na agenda) não vira scout novo em 00:00 se já
 * existir coleta da mesma data e adversário.
 */
export function resolveRealtimeOpenTarget<T extends CollectedMatchRef>(input: {
  requestedId?: string;
  fetched: T | null;
  catalog: T[];
  fixture: FixtureIdentity;
}): RealtimeOpenResolution<T> {
  const requestedId = String(input.requestedId || '').trim();
  if (input.fetched && shouldResumeRealtimeCollection(input.fetched)) {
    return { match: input.fetched, ignoredForeignId: false };
  }

  const fromCatalog = findCollectedMatchForFixture(input.catalog, input.fixture);
  if (fromCatalog && (!input.fetched || String(fromCatalog.id) !== String(input.fetched.id))) {
    return {
      match: fromCatalog,
      ignoredForeignId: Boolean(requestedId) && String(fromCatalog.id) !== requestedId,
    };
  }

  if (input.fetched && isPersistedServerMatchId(String(input.fetched.id))) {
    return { match: input.fetched, ignoredForeignId: false };
  }

  return {
    match: null,
    ignoredForeignId: Boolean(requestedId),
  };
}
