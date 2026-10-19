import { describe, expect, it } from 'vitest';
import type { MatchRecord } from '../types';
import { isPersistedServerMatchId } from './matchIds';
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

describe('matchListState', () => {
  it('lista sem log pede getById só quando há lances', () => {
    expect(matchNeedsEventLogFetch(match({ id: 'abc', date: '2026-03-01', postMatchEventCount: 4 }))).toBe(true);
    expect(matchNeedsEventLogFetch(match({ id: 'abc', date: '2026-03-01', postMatchEventCount: 0 }))).toBe(false);
    expect(
      matchNeedsEventLogFetch(match({ id: 'abc', date: '2026-03-01', postMatchEventCount: 4, postMatchEventLog: [] }))
    ).toBe(false);
    expect(matchNeedsEventLogFetch(match({ id: 'sched-1', date: '2026-03-01', postMatchEventCount: 3 }))).toBe(false);
  });

  it('merge preserva meta da lista e traz o log do detalhe', () => {
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
    expect(merged.scoreTarget).toBe('12');
    expect(merged.postMatchEventLog?.length).toBe(1);
    expect(merged.postMatchEventCount).toBe(1);
    expect(merged.teamStats.goalTimes?.length).toBe(1);
    const withServerId = mergeMatchWithEventLog(listItem, { ...full, id: 'server-id' });
    expect(withServerId.id).toBe('server-id');
  });

  it('detalhe em_andamento não rebaixa a partida encerrada da lista', () => {
    const listItem = match({ id: 'abc', date: '2026-03-01', status: 'encerrado', postMatchEventCount: 2 });
    const full = match({
      id: 'abc',
      date: '2026-03-01',
      status: 'em_andamento',
      postMatchEventLog: [{ id: 'e1', time: '01:00', period: '1T', playerId: 'p1', action: 'goal', tipo: 'gol', subtipo: '' }],
    });
    expect(mergeMatchWithEventLog(listItem, full).status).toBe('encerrado');
  });

  it('id local undefined/null não é tratado como id do servidor', () => {
    expect(isPersistedServerMatchId('undefined')).toBe(false);
    expect(isPersistedServerMatchId('null')).toBe(false);
    expect(isPersistedServerMatchId('  ')).toBe(false);
    expect(omitUnhydratedEventLog(match({ id: 'undefined', date: '2026-03-01' }), 0, 0)).toBe(false);
  });

  it('autosave não manda log vazio de partida da lista ainda sem a fita local', () => {
    const fromList = match({ id: 'abc', date: '2026-03-01', postMatchEventCount: 4 });
    expect(omitUnhydratedEventLog(fromList, 0, 0)).toBe(true);
    expect(omitUnhydratedEventLog({ ...fromList, postMatchEventLog: [{ id: 'e1' } as never] }, 0, 0)).toBe(true);
    expect(omitUnhydratedEventLog(fromList, 2, 0)).toBe(false);
    expect(omitUnhydratedEventLog(fromList, 0, 1)).toBe(false);
    expect(omitUnhydratedEventLog(match({ id: 'abc', date: '2026-03-01', postMatchEventCount: 0 }), 0, 0)).toBe(true);
    expect(omitUnhydratedEventLog(match({ id: 'abc', date: '2026-03-01', postMatchEventLog: [] }), 0, 0)).toBe(false);
    expect(omitUnhydratedEventLog(match({ id: 'sched-1', date: '2026-03-01', postMatchEventCount: 3 }), 0, 0)).toBe(false);
  });

  it('save substitui só a partida salva e insere a nova na ordem da data', () => {
    const older = match({ id: 'old', date: '2026-03-01', opponent: 'A' });
    const current = match({ id: 'mid', date: '2026-03-10', opponent: 'B', postMatchEventCount: 2 });
    const saved = match({
      id: 'mid',
      date: '2026-03-10',
      opponent: 'B atualizado',
      postMatchEventLog: [{ id: 'e1', time: '02:00', period: '1T', playerId: 'p1', action: 'goal', tipo: 'gol', subtipo: '' }],
    });
    const updated = replaceMatchInList([current, older], saved);
    expect(updated.map((item) => item.id)).toEqual(['mid', 'old']);
    expect(updated[0].opponent).toBe('B atualizado');
    expect(updated[0].postMatchEventLog?.length).toBe(1);
    expect(updated[1]).toBe(older);

    const created = match({ id: 'new', date: '2026-04-01', opponent: 'C' });
    const inserted = replaceMatchInList(updated, created);
    expect(inserted.map((item) => item.id)).toEqual(['new', 'mid', 'old']);
  });
});
