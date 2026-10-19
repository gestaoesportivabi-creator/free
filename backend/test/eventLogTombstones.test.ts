import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyUnionEventLogWrite } from '../src/services/eventLogTombstones';
import { EMPTY_UNION_EVENT_LOG_CODE, mergePostMatchEventLogs } from '../src/services/postMatchEventLogMerge';
import { ConflictError } from '../src/utils/errors';

const clock = {
  currentTimeSeconds: 90,
  period: '1T',
  state: 'PAUSADO',
  isRunning: false,
  firstHalfLocked: false,
};

describe('applyUnionEventLogWrite', () => {
  it('PUT atrasado que reenvia o lance sem deletedEventIds não ressuscita o id tombstone', () => {
    const applied = applyUnionEventLogWrite({
      existingLog: [{ id: 'fica', time: '01:00', period: '1T', action: 'pass' }],
      existingLineup: { players: ['p1'], deletedEventIds: ['saiu'] },
      incomingLog: [
        { id: 'fica', time: '01:00', period: '1T', action: 'pass' },
        { id: 'saiu', time: '02:00', period: '1T', action: 'goal' },
      ],
      incomingDeletedIds: undefined,
      incomingLineup: undefined,
      lineupProvided: false,
    });

    assert.deepEqual(
      applied.log.map((event) => (event as { id: string }).id),
      ['fica']
    );
    assert.deepEqual((applied.lineup as { deletedEventIds: string[] }).deletedEventIds, ['saiu']);
    assert.deepEqual((applied.lineup as { players: string[] }).players, ['p1']);
  });

  it('grava o id excluído no lineup e mantém o relógio', () => {
    const applied = applyUnionEventLogWrite({
      existingLog: [
        { id: 'fica', time: '01:00', period: '1T' },
        { id: 'saiu', time: '03:00', period: '1T' },
      ],
      existingLineup: { players: ['gk'], clockSnapshot: clock },
      incomingLog: [{ id: 'fica', time: '01:00', period: '1T' }],
      incomingDeletedIds: ['saiu'],
      incomingLineup: { players: ['gk', 'a'], bench: [] },
      lineupProvided: true,
    });

    assert.deepEqual(
      applied.log.map((event) => (event as { id: string }).id),
      ['fica']
    );
    const lineup = applied.lineup as {
      players: string[];
      deletedEventIds: string[];
      clockSnapshot: { currentTimeSeconds: number };
    };
    assert.deepEqual(lineup.players, ['gk', 'a']);
    assert.deepEqual(lineup.deletedEventIds, ['saiu']);
    assert.equal(lineup.clockSnapshot.currentTimeSeconds, 90);
  });

  it('lineup null no union não apaga os tombstones já gravados', () => {
    const applied = applyUnionEventLogWrite({
      existingLog: [{ id: 'fica', time: '01:00', period: '1T' }],
      existingLineup: { players: ['gk'], deletedEventIds: ['saiu'], clockSnapshot: clock },
      incomingLog: [{ id: 'fica', time: '01:00', period: '1T' }],
      incomingDeletedIds: undefined,
      incomingLineup: null,
      lineupProvided: true,
    });

    const lineup = applied.lineup as {
      deletedEventIds: string[];
      players?: string[];
      clockSnapshot?: unknown;
    };
    assert.deepEqual(lineup.deletedEventIds, ['saiu']);
    assert.equal(lineup.players, undefined);
    assert.equal(lineup.clockSnapshot, undefined);
    assert.deepEqual(
      applied.log.map((event) => (event as { id: string }).id),
      ['fica']
    );
  });

  it('acumula tombstones novos sem apagar os antigos', () => {
    const applied = applyUnionEventLogWrite({
      existingLog: [{ id: 'b', time: '02:00', period: '1T' }],
      existingLineup: { deletedEventIds: ['a'] },
      incomingLog: [],
      incomingDeletedIds: ['b'],
      incomingLineup: undefined,
      lineupProvided: false,
    });

    assert.deepEqual(applied.log, []);
    assert.deepEqual((applied.lineup as { deletedEventIds: string[] }).deletedEventIds, ['a', 'b']);
  });
});

describe('409 da fita vazia no modo union', () => {
  it('devolve código EMPTY_UNION_EVENT_LOG quando [] deixaria lances de fora', () => {
    assert.throws(
      () => mergePostMatchEventLogs([{ id: 'a', time: '01:00', period: '1T' }], []),
      (error: unknown) => {
        assert.ok(error instanceof ConflictError);
        assert.equal(error.statusCode, 409);
        assert.equal(error.code, EMPTY_UNION_EVENT_LOG_CODE);
        assert.match(error.message, /fita chegou vazia/);
        assert.match(error.message, /1 lance/);
        return true;
      }
    );
  });
});
