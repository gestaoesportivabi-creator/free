import type { MatchRecord } from '../types';
import { isPersistedServerMatchId } from './matchIds';

/**
 * Autosave de partida da lista ainda sem a fita local.
 * Log vazio sem deletedEventIds apagaria ou levaria 409; o campo sai do payload.
 * Exclusão real (deletedCount > 0) e fita já copiada para o estado local seguem no PUT.
 */
export function omitUnhydratedEventLog(
  match: Pick<MatchRecord, 'id' | 'postMatchEventLog' | 'postMatchEventCount'>,
  localEventCount: number,
  deletedCount: number
): boolean {
  const id = match.id != null ? String(match.id) : '';
  if (!isPersistedServerMatchId(id)) return false;
  if (localEventCount > 0 || deletedCount > 0) return false;
  if (matchNeedsEventLogFetch(match)) return true;
  const storedCount = Array.isArray(match.postMatchEventLog)
    ? match.postMatchEventLog.length
    : (match.postMatchEventCount ?? 0);
  return storedCount > 0;
}

/** A listagem não traz o array. Quem precisa da fita busca getById. */
export function matchNeedsEventLogFetch(match: Pick<MatchRecord, 'id' | 'postMatchEventLog' | 'postMatchEventCount'>): boolean {
  const id = match.id != null ? String(match.id) : '';
  if (!isPersistedServerMatchId(id)) return false;
  if (Array.isArray(match.postMatchEventLog)) return false;
  return (match.postMatchEventCount ?? 0) > 0;
}

/** Junta o detalhe (log + tempos de gol) sem perder campos só da lista, como a meta de desarmes. */
export function mergeMatchWithEventLog(listMatch: MatchRecord, full: MatchRecord): MatchRecord {
  const log = Array.isArray(full.postMatchEventLog) ? full.postMatchEventLog : listMatch.postMatchEventLog;
  return {
    ...listMatch,
    ...full,
    id: listMatch.id || full.id,
    scoreTarget: full.scoreTarget ?? listMatch.scoreTarget,
    postMatchEventLog: log,
    postMatchEventCount: Array.isArray(log) ? log.length : listMatch.postMatchEventCount,
  };
}

/**
 * Atualiza só a partida salva. A lista continua em ordem de data decrescente
 * quando a partida é nova.
 */
export function replaceMatchInList(prev: MatchRecord[], saved: MatchRecord): MatchRecord[] {
  const savedId = saved.id != null ? String(saved.id) : '';
  if (!savedId) return prev;
  const idx = prev.findIndex((match) => String(match.id) === savedId);
  if (idx >= 0) {
    const next = prev.slice();
    next[idx] = mergeMatchWithEventLog(prev[idx], saved);
    return next;
  }
  const date = String(saved.date || '');
  let insertAt = prev.findIndex((match) => String(match.date || '') < date);
  if (insertAt < 0) insertAt = prev.length;
  const next = prev.slice();
  next.splice(insertAt, 0, saved);
  return next;
}
