import type { MatchRecord } from '../types';

export const COLLECTION_SAVE_QUEUE_PREFIX = 'scout21:collection-save-queue:v1:';

export interface CollectionSaveQueueEntry {
  version: 1;
  matchId: string;
  snapshot: MatchRecord;
  signature: string;
  eventIds: string[];
  pendingEventIds: string[];
  attempts: number;
  nextAttemptAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface QueueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type QueueReconciliation =
  | 'none'
  | 'restore-local'
  | 'server-ahead'
  | 'conflict';

const eventIdsFrom = (snapshot: MatchRecord): string[] =>
  (snapshot.postMatchEventLog ?? [])
    .map((event) => String(event.id ?? '').trim())
    .filter(Boolean);

/**
 * Identidade do que precisa chegar ao servidor. O relógio corrente e os segundos de
 * posse avançam a cada segundo com a partida rodando; incluí-los aqui criaria uma
 * entrada nova por segundo e a fila nunca drenaria.
 */
export function collectionQueueSignature(snapshot: MatchRecord): string {
  return JSON.stringify({
    postMatchEventLog: snapshot.postMatchEventLog ?? [],
    substitutionHistory: snapshot.substitutionHistory ?? [],
    lineupPlayers: snapshot.lineup?.players ?? [],
    lineupBench: snapshot.lineup?.bench ?? [],
    lineupSelected: snapshot.lineup?.selectedPlayerIds ?? [],
    ballPossessionStart: snapshot.lineup?.ballPossessionStart ?? null,
    collectionPhase: snapshot.collectionPhase ?? null,
    status: snapshot.status ?? null,
  });
}

export const collectionSaveQueueKey = (matchId: string): string =>
  `${COLLECTION_SAVE_QUEUE_PREFIX}${String(matchId).trim()}`;

export function readCollectionSaveQueue(
  storage: QueueStorage,
  matchId: string
): CollectionSaveQueueEntry | null {
  const normalizedMatchId = String(matchId).trim();
  if (!normalizedMatchId) return null;
  try {
    const raw = storage.getItem(collectionSaveQueueKey(normalizedMatchId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CollectionSaveQueueEntry>;
    if (
      parsed.version !== 1 ||
      parsed.matchId !== normalizedMatchId ||
      !parsed.snapshot ||
      typeof parsed.signature !== 'string' ||
      !Array.isArray(parsed.eventIds) ||
      !Array.isArray(parsed.pendingEventIds)
    ) {
      return null;
    }
    return parsed as CollectionSaveQueueEntry;
  } catch {
    return null;
  }
}

export function enqueueCollectionSnapshot(
  storage: QueueStorage,
  matchId: string,
  snapshot: MatchRecord,
  persistedEventIds: Iterable<string>,
  now = Date.now()
): CollectionSaveQueueEntry {
  const normalizedMatchId = String(matchId).trim();
  if (!normalizedMatchId) throw new Error('Fila de coleta exige matchId.');
  const signature = collectionQueueSignature(snapshot);
  const existing = readCollectionSaveQueue(storage, normalizedMatchId);
  if (existing?.signature === signature) {
    // Mesmo conteúdo pendente: atualiza o snapshot (relógio/posse mais recentes) sem
    // reiniciar tentativas nem perder o backoff em curso.
    const refreshed: CollectionSaveQueueEntry = { ...existing, snapshot, updatedAt: now };
    storage.setItem(collectionSaveQueueKey(normalizedMatchId), JSON.stringify(refreshed));
    return refreshed;
  }

  const persisted = new Set(Array.from(persistedEventIds, (id) => String(id).trim()));
  const eventIds = eventIdsFrom(snapshot);
  const entry: CollectionSaveQueueEntry = {
    version: 1,
    matchId: normalizedMatchId,
    snapshot,
    signature,
    eventIds,
    pendingEventIds: eventIds.filter((id) => !persisted.has(id)),
    attempts: 0,
    nextAttemptAt: now,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  storage.setItem(collectionSaveQueueKey(normalizedMatchId), JSON.stringify(entry));
  return entry;
}

export function markCollectionSaveFailure(
  storage: QueueStorage,
  entry: CollectionSaveQueueEntry,
  now = Date.now(),
  baseDelayMs = 1000,
  maxDelayMs = 30_000
): CollectionSaveQueueEntry {
  const attempts = entry.attempts + 1;
  const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** Math.max(0, attempts - 1));
  const failed = {
    ...entry,
    attempts,
    nextAttemptAt: now + delay,
    updatedAt: now,
  };
  storage.setItem(collectionSaveQueueKey(entry.matchId), JSON.stringify(failed));
  return failed;
}

/** Retomada de rede não deve esperar o backoff exponencial acumulado offline. */
export function resetCollectionSaveBackoff(
  storage: QueueStorage,
  matchId: string,
  now = Date.now()
): CollectionSaveQueueEntry | null {
  const current = readCollectionSaveQueue(storage, matchId);
  if (!current) return null;
  const revived: CollectionSaveQueueEntry = {
    ...current,
    attempts: 0,
    nextAttemptAt: now,
    updatedAt: now,
  };
  storage.setItem(collectionSaveQueueKey(current.matchId), JSON.stringify(revived));
  return revived;
}

export function clearCollectionSaveQueue(
  storage: QueueStorage,
  matchId: string,
  expectedSignature?: string
): boolean {
  const current = readCollectionSaveQueue(storage, matchId);
  if (!current) return true;
  if (expectedSignature && current.signature !== expectedSignature) return false;
  storage.removeItem(collectionSaveQueueKey(matchId));
  return true;
}

export function reconcileCollectionSaveQueue(
  entry: CollectionSaveQueueEntry | null,
  serverSnapshot: MatchRecord
): QueueReconciliation {
  if (!entry) return 'none';
  const serverIds = new Set(eventIdsFrom(serverSnapshot as MatchRecord));
  const localIds = new Set(entry.eventIds);
  const serverContainedLocally = [...serverIds].every((id) => localIds.has(id));
  const localContainedOnServer = [...localIds].every((id) => serverIds.has(id));

  if (localContainedOnServer && serverIds.size > localIds.size) return 'server-ahead';
  if (localContainedOnServer && serverIds.size === localIds.size) {
    const relevantSnapshot = (snapshot: MatchRecord) =>
      JSON.stringify({
        postMatchEventLog: snapshot.postMatchEventLog ?? [],
        substitutionHistory: snapshot.substitutionHistory ?? [],
        lineup: snapshot.lineup ?? null,
        collectionPhase: snapshot.collectionPhase ?? null,
        possessionSecondsWith: snapshot.possessionSecondsWith ?? 0,
        possessionSecondsWithout: snapshot.possessionSecondsWithout ?? 0,
        status: snapshot.status,
      });
    return relevantSnapshot(entry.snapshot) === relevantSnapshot(serverSnapshot)
      ? 'server-ahead'
      : 'conflict';
  }
  if (serverContainedLocally && localIds.size > serverIds.size) return 'restore-local';
  return 'conflict';
}
