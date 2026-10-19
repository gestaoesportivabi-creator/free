import { useEffect, useMemo, useState } from 'react';
import type { MatchRecord } from '../types';
import { matchesApi } from '../services/api';
import { matchNeedsEventLogFetch, mergeMatchWithEventLog } from './matchListState';

const cache = new Map<string, MatchRecord>();
const inflight = new Map<string, Promise<MatchRecord | null>>();

function cacheKey(id: string, eventCount: number): string {
  return `${id}:${eventCount}`;
}

export function readCachedMatchDetail(id: string, eventCount?: number): MatchRecord | undefined {
  if (eventCount == null) return undefined;
  return cache.get(cacheKey(id, eventCount));
}

export function rememberMatchDetail(match: MatchRecord): void {
  if (!match.id || !Array.isArray(match.postMatchEventLog)) return;
  cache.set(cacheKey(String(match.id), match.postMatchEventLog.length), {
    ...match,
    postMatchEventCount: match.postMatchEventLog.length,
  });
}

export function loadMatchWithEventLog(id: string, eventCount?: number): Promise<MatchRecord | null> {
  if (eventCount != null) {
    const cached = readCachedMatchDetail(id, eventCount);
    if (cached) return Promise.resolve(cached);
  }
  const existing = inflight.get(id);
  if (existing) return existing;
  const pending = matchesApi
    .getById(id)
    .then((full) => {
      if (full) rememberMatchDetail(full);
      return full;
    })
    .finally(() => {
      inflight.delete(id);
    });
  inflight.set(id, pending);
  return pending;
}

/**
 * Hidrata o log só das partidas que a tela realmente usa.
 * A lista global continua sem o array.
 */
export function useMatchesWithEventLogs(matches: MatchRecord[]): { matches: MatchRecord[]; loading: boolean } {
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(false);
  const signature = matches
    .map((match) => `${match.id ?? ''}:${Array.isArray(match.postMatchEventLog) ? 'log' : match.postMatchEventCount ?? 0}`)
    .join('|');

  useEffect(() => {
    const missing = matches.filter(matchNeedsEventLogFetch);
    if (missing.length === 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const concurrency = 4;
    let cursor = 0;
    const runWorker = async () => {
      while (!cancelled) {
        const index = cursor;
        cursor += 1;
        if (index >= missing.length) return;
        const match = missing[index];
        try {
          await loadMatchWithEventLog(String(match.id), match.postMatchEventCount);
        } catch (error) {
          console.warn('Falha ao carregar lances da partida', match.id, error);
        }
      }
    };
    void Promise.all(Array.from({ length: Math.min(concurrency, missing.length) }, () => runWorker())).then(() => {
      if (!cancelled) {
        setLoading(false);
        setTick((value) => value + 1);
      }
    });
    return () => {
      cancelled = true;
    };
    // A assinatura resume id + contagem. O array em si entra no useMemo abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const hydrated = useMemo(
    () =>
      matches.map((match) => {
        if (!matchNeedsEventLogFetch(match)) return match;
        const full = readCachedMatchDetail(String(match.id), match.postMatchEventCount);
        if (!full) return match;
        return mergeMatchWithEventLog(match, full);
      }),
    [matches, tick]
  );

  return { matches: hydrated, loading };
}
