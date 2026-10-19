import assert from 'node:assert/strict';
import test from 'node:test';
import type { MatchRecord } from '../types';
import { matchNeedsEventLogFetch, mergeMatchWithEventLog, omitUnhydratedEventLog, replaceMatchInList } from './matchListState';

function match(partial: Partial<MatchRecord> & Pick<MatchRecord, 'id' | 'date'>): MatchRecord {
  return {
    opponent: 'Rival',
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

test('lista sem log pede getById só quando há lances', () => {
  assert.equal(matchNeedsEventLogFetch(match({ id: 'abc', date: '2026-03-01', postMatchEventCount: 4 })), true);
  assert.equal(matchNeedsEventLogFetch(match({ id: 'abc', date: '2026-03-01', postMatchEventCount: 0 })), false);
  assert.equal(
    matchNeedsEventLogFetch(match({ id: 'abc', date: '2026-03-01', postMatchEventCount: 4, postMatchEventLog: [] })),
    false
  );
  assert.equal(matchNeedsEventLogFetch(match({ id: 'sched-1', date: '2026-03-01', postMatchEventCount: 3 })), false);
});

test('merge preserva meta da lista e traz o log do detalhe', () => {
  const listItem = match({ id: 'abc', date: '2026-03-01', scoreTarget: '12', postMatchEventCount: 1 });
  const full = match({
    id: 'abc',
    date: '2026-03-01',
    postMatchEventLog: [{ id: 'e1', time: '01:00', period: '1T', playerId: 'p1', action: 'goal', tipo: 'gol', subtipo: '' }],
    teamStats: {
      ...listItem.teamStats,
      goals: 1,
      goalTimes: [{ time: '01:00 (1T)' }],
    },
  });
  const merged = mergeMatchWithEventLog(listItem, full);
  assert.equal(merged.scoreTarget, '12');
  assert.equal(merged.postMatchEventLog?.length, 1);
  assert.equal(merged.postMatchEventCount, 1);
  assert.equal(merged.teamStats.goalTimes?.length, 1);
});

test('autosave não manda log vazio de partida da lista ainda sem a fita local', () => {
  const fromList = match({ id: 'abc', date: '2026-03-01', postMatchEventCount: 4 });
  assert.equal(omitUnhydratedEventLog(fromList, 0, 0), true);
  assert.equal(omitUnhydratedEventLog({ ...fromList, postMatchEventLog: [{ id: 'e1' } as never] }, 0, 0), true);
  assert.equal(omitUnhydratedEventLog(fromList, 2, 0), false);
  assert.equal(omitUnhydratedEventLog(fromList, 0, 1), false);
  assert.equal(omitUnhydratedEventLog(match({ id: 'abc', date: '2026-03-01', postMatchEventCount: 0 }), 0, 0), false);
  assert.equal(omitUnhydratedEventLog(match({ id: 'sched-1', date: '2026-03-01', postMatchEventCount: 3 }), 0, 0), false);
});

test('save substitui só a partida salva e insere a nova na ordem da data', () => {
  const older = match({ id: 'old', date: '2026-03-01', opponent: 'A' });
  const current = match({ id: 'mid', date: '2026-03-10', opponent: 'B', postMatchEventCount: 2 });
  const saved = match({
    id: 'mid',
    date: '2026-03-10',
    opponent: 'B atualizado',
    postMatchEventLog: [{ id: 'e1', time: '02:00', period: '1T', playerId: 'p1', action: 'goal', tipo: 'gol', subtipo: '' }],
  });
  const updated = replaceMatchInList([current, older], saved);
  assert.deepEqual(updated.map((item) => item.id), ['mid', 'old']);
  assert.equal(updated[0].opponent, 'B atualizado');
  assert.equal(updated[0].postMatchEventLog?.length, 1);
  assert.equal(updated[1], older);

  const created = match({ id: 'new', date: '2026-04-01', opponent: 'C' });
  const inserted = replaceMatchInList(updated, created);
  assert.deepEqual(inserted.map((item) => item.id), ['new', 'mid', 'old']);
});
