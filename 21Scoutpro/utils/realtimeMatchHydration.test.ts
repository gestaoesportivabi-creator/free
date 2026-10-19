import { describe, expect, it } from 'vitest';
import type { MatchRecord } from '../types';
import { draftIdForChampionshipMatch, isPersistedServerMatchId } from './matchIds';
import { adoptServerMatch } from './realtimeMatchHydration';

function match(partial: Partial<MatchRecord> & Pick<MatchRecord, 'id'>): MatchRecord {
  return {
    date: '2026-10-19',
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

describe('adoptServerMatch', () => {
  it('fica com a fita do servidor mesmo se o status não é em_andamento', () => {
    const adopted = adoptServerMatch(
      match({
        id: 'jogo-1',
        status: 'encerrado',
        postMatchEventLog: [{ id: 'e1', time: '01:00', period: '1T', playerId: 'p1', action: 'goal', tipo: 'gol', subtipo: '' }],
      }),
      'Mandante'
    );
    expect(adopted.postMatchEventLog).toHaveLength(1);
    expect(adopted.postMatchEventCount).toBe(1);
    expect(adopted.location).toBe('Mandante');
  });

  it('busca bem-sucedida sem array registra contagem 0', () => {
    const adopted = adoptServerMatch(match({ id: 'jogo-1', status: 'em_andamento' }));
    expect(adopted.postMatchEventLog).toBeUndefined();
    expect(adopted.postMatchEventCount).toBe(0);
  });
});

describe('draftIdForChampionshipMatch', () => {
  it('não manda o id cru de championship_matches como id de jogo', () => {
    const draft = draftIdForChampionshipMatch('cm-123');
    expect(draft).toBe('sched-cm-123');
    expect(isPersistedServerMatchId(draft)).toBe(false);
    expect(draftIdForChampionshipMatch('sched-cm-123')).toBe('sched-cm-123');
  });
});
