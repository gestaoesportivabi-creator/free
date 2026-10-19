import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  buildPersistedClockSnapshot,
  mergeLineupClockSnapshot,
  resolveRealtimeReopenClock,
} from '../utils/matchClockPersistence';

const liveFirstHalf = {
  currentTimeSeconds: 192,
  period: '1T' as const,
  state: 'PRIMEIRO_TEMPO' as const,
  isRunning: true,
  firstHalfLocked: false,
};

const savedClock = buildPersistedClockSnapshot(liveFirstHalf);

describe('save preserva clockSnapshot', () => {
  test('save pós-jogo sem snapshot novo mantém período, tempo e estado do ao vivo', () => {
    const storedLineup = {
      players: ['p1', 'p2', 'p3', 'p4', 'p5'],
      bench: ['b1'],
      ballPossessionStart: 'us' as const,
      selectedPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'b1'],
      clockSnapshot: savedClock,
    };

    const postmatchPayload = {
      players: ['p1', 'p2', 'p3', 'p4', 'p5'],
      bench: ['b1'],
      ballPossessionStart: 'us' as const,
      selectedPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'b1'],
    };

    const merged = mergeLineupClockSnapshot(postmatchPayload, storedLineup);

    assert.deepEqual(merged.clockSnapshot, {
      currentTimeSeconds: 192,
      period: '1T',
      state: 'PAUSADO',
      isRunning: false,
      firstHalfLocked: false,
    });
    assert.deepEqual(merged.players, postmatchPayload.players);
    assert.equal(merged.clockSnapshot?.state, 'PAUSADO');
  });

  test('snapshot novo e válido substitui o anterior', () => {
    const nextClock = buildPersistedClockSnapshot({
      currentTimeSeconds: 455,
      period: '2T',
      state: 'SEGUNDO_TEMPO',
      isRunning: true,
      firstHalfLocked: true,
    });
    const merged = mergeLineupClockSnapshot(
      {
        players: ['p1'],
        bench: [],
        ballPossessionStart: 'opponent' as const,
        clockSnapshot: nextClock,
      },
      {
        players: ['old'],
        bench: [],
        ballPossessionStart: 'us' as const,
        clockSnapshot: savedClock,
      }
    );

    assert.equal(merged.clockSnapshot?.currentTimeSeconds, 455);
    assert.equal(merged.clockSnapshot?.period, '2T');
    assert.equal(merged.clockSnapshot?.firstHalfLocked, true);
    assert.equal(merged.clockSnapshot?.isRunning, false);
    assert.deepEqual(merged.players, ['p1']);
  });

  test('snapshot inválido no payload não apaga o relógio já salvo', () => {
    const merged = mergeLineupClockSnapshot(
      {
        players: ['p1'],
        bench: [],
        ballPossessionStart: 'us' as const,
        clockSnapshot: { period: '3T', currentTimeSeconds: 10 },
      },
      { clockSnapshot: savedClock }
    );

    assert.equal(merged.clockSnapshot?.currentTimeSeconds, 192);
    assert.equal(merged.clockSnapshot?.period, '1T');
  });
});

describe('reopen restaura o relógio', () => {
  test('reabre no tempo salvo mesmo se a fase da coleta foi para o 2T', () => {
    const reopened = resolveRealtimeReopenClock({
      persistedClock: savedClock,
      events: [
        { time: 40, period: '1T' },
        { time: 12, period: '2T' },
      ],
      hasLog: true,
      collectionPhase: 2,
      inSecondHalf: true,
      hasPossessionProgress: true,
    });

    assert.equal(reopened.needsClockSyncFallback, false);
    assert.deepEqual(reopened.clock, {
      seconds: 192,
      period: '1T',
      firstHalfLocked: false,
      state: 'PAUSADO',
      isRunning: false,
    });
  });

  test('estado em andamento reabre pausado, com o mesmo segundo', () => {
    const reopened = resolveRealtimeReopenClock({
      persistedClock: {
        currentTimeSeconds: 455,
        period: '2T',
        state: 'SEGUNDO_TEMPO',
        isRunning: true,
        firstHalfLocked: true,
      },
      events: [{ time: 400, period: '2T' }],
      hasLog: true,
      collectionPhase: 2,
      inSecondHalf: true,
      hasPossessionProgress: false,
    });

    assert.equal(reopened.needsClockSyncFallback, false);
    assert.equal(reopened.clock.seconds, 455);
    assert.equal(reopened.clock.period, '2T');
    assert.equal(reopened.clock.state, 'PAUSADO');
    assert.equal(reopened.clock.firstHalfLocked, true);
    assert.equal(reopened.clock.isRunning, false);
  });

  test('sem snapshot e sem fita no 2T continua pedindo sincronização em 00:00', () => {
    const reopened = resolveRealtimeReopenClock({
      persistedClock: undefined,
      events: [],
      hasLog: false,
      collectionPhase: 2,
      inSecondHalf: true,
      hasPossessionProgress: false,
    });

    assert.equal(reopened.needsClockSyncFallback, true);
    assert.equal(reopened.clock.seconds, 0);
    assert.equal(reopened.clock.period, '2T');
    assert.equal(reopened.clock.state, 'PAUSADO');
  });
});
