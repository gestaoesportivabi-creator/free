import { expect, test } from '@playwright/test';
import type { MatchRecord, PostMatchEvent } from '../../types';
import {
  clearCollectionSaveQueue,
  enqueueCollectionSnapshot,
  markCollectionSaveFailure,
  readCollectionSaveQueue,
  reconcileCollectionSaveQueue,
  resetCollectionSaveBackoff,
  type QueueStorage,
} from '../../utils/collectionSaveQueue';

class MemoryStorage implements QueueStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const event = (id: string): PostMatchEvent => ({
  id,
  time: '01:00',
  period: '1T',
  playerId: 'player-1',
  action: 'shotOff',
  tipo: 'Finalização',
  subtipo: 'Pra fora',
});

const snapshot = (...ids: string[]): MatchRecord =>
  ({
    id: 'match-1',
    status: 'em_andamento',
    postMatchEventLog: ids.map(event),
  }) as MatchRecord;

test('fila local coalesce o PUT monolítico sem perder os IDs pendentes', () => {
  const storage = new MemoryStorage();
  const first = enqueueCollectionSnapshot(
    storage,
    'match-1',
    snapshot('event-1', 'event-2'),
    ['event-1'],
    1000
  );
  expect(first.pendingEventIds).toEqual(['event-2']);

  const latest = enqueueCollectionSnapshot(
    storage,
    'match-1',
    snapshot('event-1', 'event-2', 'event-3'),
    ['event-1'],
    1200
  );
  expect(latest.eventIds).toEqual(['event-1', 'event-2', 'event-3']);
  expect(latest.pendingEventIds).toEqual(['event-2', 'event-3']);
  expect(readCollectionSaveQueue(storage, 'match-1')?.signature).toBe(latest.signature);
});

test('falhas usam backoff exponencial limitado e clear protege snapshot mais novo', () => {
  const storage = new MemoryStorage();
  let queued = enqueueCollectionSnapshot(storage, 'match-1', snapshot('event-1'), [], 1000);
  queued = markCollectionSaveFailure(storage, queued, 1000);
  expect(queued).toMatchObject({ attempts: 1, nextAttemptAt: 2000 });
  queued = markCollectionSaveFailure(storage, queued, 2000);
  expect(queued).toMatchObject({ attempts: 2, nextAttemptAt: 4000 });
  queued = markCollectionSaveFailure(storage, queued, 4000, 1000, 2500);
  expect(queued).toMatchObject({ attempts: 3, nextAttemptAt: 6500 });

  expect(clearCollectionSaveQueue(storage, 'match-1', 'assinatura-antiga')).toBe(false);
  expect(readCollectionSaveQueue(storage, 'match-1')).not.toBeNull();
  expect(clearCollectionSaveQueue(storage, 'match-1', queued.signature)).toBe(true);
  expect(readCollectionSaveQueue(storage, 'match-1')).toBeNull();
});

test('avanço de relógio e posse não cria entrada nova nem reinicia o backoff', () => {
  const storage = new MemoryStorage();
  const running = (seconds: number): MatchRecord =>
    ({
      ...snapshot('event-1'),
      possessionSecondsWith: seconds,
      lineup: {
        players: ['player-1'],
        bench: [],
        ballPossessionStart: 'us',
        clockSnapshot: {
          currentTimeSeconds: seconds,
          period: '1T',
          state: 'PAUSADO',
          isRunning: false,
          firstHalfLocked: false,
        },
      },
    }) as unknown as MatchRecord;

  const first = enqueueCollectionSnapshot(storage, 'match-1', running(10), [], 1000);
  const failed = markCollectionSaveFailure(storage, first, 1000);
  expect(failed).toMatchObject({ attempts: 1, nextAttemptAt: 2000 });

  const ticked = enqueueCollectionSnapshot(storage, 'match-1', running(11), [], 1500);
  expect(ticked.signature).toBe(first.signature);
  expect(ticked).toMatchObject({ attempts: 1, nextAttemptAt: 2000 });
  expect((ticked.snapshot as { possessionSecondsWith?: number }).possessionSecondsWith).toBe(11);

  const withEvent = enqueueCollectionSnapshot(
    storage,
    'match-1',
    { ...running(12), postMatchEventLog: snapshot('event-1', 'event-2').postMatchEventLog },
    [],
    1600
  );
  expect(withEvent.signature).not.toBe(first.signature);
  expect(withEvent.attempts).toBe(0);

  expect(clearCollectionSaveQueue(storage, 'match-1', withEvent.signature)).toBe(true);
});

test('retomada zera o backoff acumulado durante a queda', () => {
  const storage = new MemoryStorage();
  let queued = enqueueCollectionSnapshot(storage, 'match-1', snapshot('event-1'), [], 1000);
  queued = markCollectionSaveFailure(storage, queued, 1000);
  queued = markCollectionSaveFailure(storage, queued, 2000);
  queued = markCollectionSaveFailure(storage, queued, 4000);
  expect(queued).toMatchObject({ attempts: 3, nextAttemptAt: 8000 });

  const revived = resetCollectionSaveBackoff(storage, 'match-1', 9000);
  expect(revived).toMatchObject({ attempts: 0, nextAttemptAt: 9000 });
  expect(readCollectionSaveQueue(storage, 'match-1')).toMatchObject({ nextAttemptAt: 9000 });
  expect(resetCollectionSaveBackoff(storage, 'match-inexistente', 9000)).toBeNull();
});

test('reconciliação só restaura quando o servidor é subconjunto da fila', () => {
  const storage = new MemoryStorage();
  const queued = enqueueCollectionSnapshot(
    storage,
    'match-1',
    snapshot('event-1', 'event-2'),
    ['event-1'],
    1000
  );

  expect(reconcileCollectionSaveQueue(queued, snapshot('event-1'))).toBe('restore-local');
  expect(reconcileCollectionSaveQueue(queued, snapshot('event-1', 'event-2'))).toBe(
    'server-ahead'
  );
  expect(reconcileCollectionSaveQueue(queued, snapshot('event-1', 'event-2', 'event-3'))).toBe(
    'server-ahead'
  );
  expect(reconcileCollectionSaveQueue(queued, snapshot('other-event'))).toBe('conflict');
  expect(reconcileCollectionSaveQueue(null, snapshot('event-1'))).toBe('none');
});
