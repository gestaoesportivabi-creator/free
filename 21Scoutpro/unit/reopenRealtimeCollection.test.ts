import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  findCollectedMatchForFixture,
  resolveRealtimeOpenTarget,
  shouldResumeRealtimeCollection,
} from '../utils/reopenRealtimeCollection';
import { splitChampionshipFixtures } from '../utils/championshipMatchBuckets';
import { replaceMatchInList } from '../utils/matchListState';
import type { MatchRecord } from '../types';

const clock = {
  currentTimeSeconds: 93,
  period: '2T' as const,
  state: 'ENCERRADO' as const,
  isRunning: false,
  firstHalfLocked: true,
};

function saved(partial: Partial<MatchRecord> & { id: string }): MatchRecord {
  return {
    opponent: 'Rival QA',
    date: '2026-10-25',
    result: 'E',
    goalsFor: 0,
    goalsAgainst: 0,
    playerStats: {},
    teamStats: {
      goals: 0,
      assists: 0,
      passesCorrect: 0,
      passesWrong: 0,
      shotsOnTarget: 0,
      shotsOffTarget: 0,
      tacklesWithBall: 0,
      tacklesWithoutBall: 0,
      tacklesCounterAttack: 0,
      transitionErrors: 0,
    },
    ...partial,
  };
}

describe('reabrir scout em tempo real na coleta existente', () => {
  test('id da agenda não abre scout novo se já existe coleta encerrada da mesma partida', () => {
    const collected = saved({
      id: 'jogo-1',
      status: 'encerrado',
      postMatchEventCount: 112,
      lineup: { players: ['a'], bench: [], ballPossessionStart: 'us', clockSnapshot: clock },
    });
    const resolution = resolveRealtimeOpenTarget({
      requestedId: 'agenda-futura',
      fetched: null,
      catalog: [collected],
      fixture: { date: '2026-10-25', opponent: 'Rival QA', competition: 'Amistoso' },
    });

    assert.equal(resolution.ignoredForeignId, true);
    assert.equal(resolution.match?.id, 'jogo-1');
    assert.equal(shouldResumeRealtimeCollection(resolution.match), true);
  });

  test('partida encerrada com fita e relógio é a coleta a hidratar', () => {
    const full = saved({
      id: 'jogo-1',
      status: 'encerrado',
      postMatchEventLog: [{ id: 'e1' } as never],
      lineup: { players: ['a'], bench: [], ballPossessionStart: 'us', clockSnapshot: clock },
    });
    const resolution = resolveRealtimeOpenTarget({
      requestedId: 'jogo-1',
      fetched: full,
      catalog: [],
      fixture: { date: full.date, opponent: full.opponent },
    });
    assert.equal(resolution.match?.id, 'jogo-1');
    assert.equal(resolution.ignoredForeignId, false);
  });

  test('sem coleta anterior, o id de agenda é ignorado para não gravar em cima dele', () => {
    const resolution = resolveRealtimeOpenTarget({
      requestedId: 'agenda-futura',
      fetched: null,
      catalog: [],
      fixture: { date: '2026-10-25', opponent: 'Rival QA' },
    });
    assert.equal(resolution.match, null);
    assert.equal(resolution.ignoredForeignId, true);
  });

  test('4 a 3 não confunde a busca: outra data não reaproveita a coleta', () => {
    const other = saved({
      id: 'jogo-outro',
      date: '2026-10-20',
      status: 'encerrado',
      postMatchEventCount: 10,
    });
    assert.equal(
      findCollectedMatchForFixture([other], { date: '2026-10-25', opponent: 'Rival QA' }),
      null
    );
  });
});

describe('lista depois de Finalizar', () => {
  const today = new Date(2026, 9, 19);

  test('partida futura da tabela passa a passada quando o jogo encerrado entra na lista', () => {
    const scheduled = [{
      id: 'agenda-1',
      date: '2026-10-25',
      opponent: 'Rival QA',
      time: '20:00',
    }];
    const before = splitChampionshipFixtures(scheduled, [], today);
    assert.deepEqual(before.future.map((item) => item.id), ['agenda-1']);
    assert.deepEqual(before.past, []);

    const stale: MatchRecord[] = [];
    const finalized = saved({ id: 'jogo-1', status: 'encerrado', postMatchEventCount: 112 });
    const fresh = replaceMatchInList(stale, finalized);
    const after = splitChampionshipFixtures(scheduled, fresh, today);
    assert.deepEqual(after.past.map((item) => item.id), ['agenda-1']);
    assert.deepEqual(after.future, []);
  });

  test('jogoId vinculado também tira a partida das futuras', () => {
    const split = splitChampionshipFixtures(
      [{ id: 'agenda-1', date: '2026-11-02', opponent: 'Nome diferente', jogoId: 'jogo-1' }],
      [saved({ id: 'jogo-1', opponent: 'Outro', date: '2026-11-02', status: 'encerrado' })],
      today
    );
    assert.equal(split.past.length, 1);
    assert.equal(split.future.length, 0);
  });
});
