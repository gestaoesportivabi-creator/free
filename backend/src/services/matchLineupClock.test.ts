import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { mergeLineupPreservingClockSnapshot } from './matchLineupClock';

const clockDoClube = {
  currentTimeSeconds: 192,
  period: '1T' as const,
  state: 'PAUSADO',
  isRunning: false,
  firstHalfLocked: false,
};

const clockDeOutraPartida = {
  currentTimeSeconds: 999,
  period: '2T' as const,
  state: 'PAUSADO',
  isRunning: false,
  firstHalfLocked: true,
};

describe('update de partida preserva clockSnapshot do próprio lineup', () => {
  test('payload sem snapshot mantém o relógio já gravado e o restante do lineup novo', () => {
    const merged = mergeLineupPreservingClockSnapshot(
      {
        players: ['antigo'],
        bench: [],
        ballPossessionStart: 'us',
        clockSnapshot: clockDoClube,
      },
      {
        players: ['novo-goleiro', 'a', 'b', 'c', 'd'],
        bench: ['reserva'],
        ballPossessionStart: 'opponent',
        selectedPlayerIds: ['novo-goleiro', 'a', 'b', 'c', 'd', 'reserva'],
        technicalAnalysis: { tactical: 'pressão' },
      }
    ) as {
      players: string[];
      ballPossessionStart: string;
      technicalAnalysis: { tactical: string };
      clockSnapshot: typeof clockDoClube;
    };

    assert.deepEqual(merged.players, ['novo-goleiro', 'a', 'b', 'c', 'd']);
    assert.equal(merged.ballPossessionStart, 'opponent');
    assert.equal(merged.technicalAnalysis.tactical, 'pressão');
    assert.deepEqual(merged.clockSnapshot, clockDoClube);
  });

  test('snapshot novo válido substitui o anterior', () => {
    const merged = mergeLineupPreservingClockSnapshot(
      { clockSnapshot: clockDoClube, players: ['a'] },
      {
        players: ['a'],
        clockSnapshot: {
          currentTimeSeconds: 455,
          period: '2T',
          state: 'PAUSADO',
          isRunning: false,
          firstHalfLocked: true,
        },
      }
    ) as { clockSnapshot: { currentTimeSeconds: number; period: string } };

    assert.equal(merged.clockSnapshot.currentTimeSeconds, 455);
    assert.equal(merged.clockSnapshot.period, '2T');
  });

  test('não usa o relógio de outro objeto que não foi passado como lineup desta partida', () => {
    const merged = mergeLineupPreservingClockSnapshot(
      { players: ['somente-esta-partida'], clockSnapshot: clockDoClube },
      { players: ['somente-esta-partida'], bench: [] }
    ) as { clockSnapshot: typeof clockDoClube };

    assert.notDeepEqual(merged.clockSnapshot, clockDeOutraPartida);
    assert.deepEqual(merged.clockSnapshot, clockDoClube);
  });

  test('lineup nulo continua limpeza explícita e undefined não inventa lineup', () => {
    assert.equal(mergeLineupPreservingClockSnapshot({ clockSnapshot: clockDoClube }, null), null);
    assert.equal(mergeLineupPreservingClockSnapshot({ clockSnapshot: clockDoClube }, undefined), undefined);
  });
});
