import type { MatchRecord } from '../types';

/**
 * getById devolveu a partida: usa o registro do servidor, inclusive a fita.
 * Sem array, a contagem 0 registra que a busca viu uma fita vazia.
 */
export function adoptServerMatch(dbMatch: MatchRecord, locationFromPrep?: string): MatchRecord {
  const count = Array.isArray(dbMatch.postMatchEventLog)
    ? dbMatch.postMatchEventLog.length
    : typeof dbMatch.postMatchEventCount === 'number'
      ? dbMatch.postMatchEventCount
      : 0;
  return {
    ...dbMatch,
    location: dbMatch.location?.trim() || locationFromPrep,
    postMatchEventCount: count,
  };
}
