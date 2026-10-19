import { describe, expect, it } from 'vitest';
import type { MatchRecord } from '../types';
import {
  GOAL_BY_PERIOD_LABELS,
  countGoalsByPeriod,
  goalClockStringsFromMatch,
  parseAggregatedGoalTimeToTotalSeconds,
  summarizeGoalPeriods,
} from './goalPeriodBuckets';

function match(partial: Partial<MatchRecord>): MatchRecord {
  return {
    id: 'm1',
    date: '2026-10-19',
    opponent: 'Rival QA 1849',
    result: 'V',
    goalsFor: 3,
    goalsAgainst: 0,
    playerStats: {},
    teamStats: {
      goals: 3,
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

describe('gols por período', () => {
  it('agregado MM:SS (1T/2T) coloca o 2T que reinicia em 00:00 na faixa 15:01-20:00', () => {
    const times = ['02:00 (1T)', '04:00 (1T)', '00:00 (2T)'];
    const counts = countGoalsByPeriod(times);
    expect(counts).toEqual([2, 0, 0, 1, 0, 0, 0, 0, 0, 0]);
    expect(counts[GOAL_BY_PERIOD_LABELS.indexOf('45:01 - 50:00')]).toBe(0);
    expect(counts[GOAL_BY_PERIOD_LABELS.indexOf('10:01 - 15:00')]).toBe(0);
    const summary = summarizeGoalPeriods(counts);
    expect(summary.maxLabel).toBe('00:00 - 05:00');
    expect(summary.percentage).toBe('66.67');
    expect(summary.maxCount).toBe(2);
  });

  it('21:10 (2T) permanece absoluto e não vai para 45:01-50:00', () => {
    const seconds = parseAggregatedGoalTimeToTotalSeconds('21:10 (2T)');
    expect(seconds).toBe(21 * 60 + 10);
    const counts = countGoalsByPeriod(['21:10 (2T)']);
    expect(counts[GOAL_BY_PERIOD_LABELS.indexOf('20:01 - 25:00')]).toBe(1);
    expect(counts[GOAL_BY_PERIOD_LABELS.indexOf('45:01 - 50:00')]).toBe(0);
  });

  it('com a fita, Todos usa o mesmo relógio do log que o filtro usava antes da listagem sem log', () => {
    const fromLog = match({
      postMatchEventLog: [
        { id: 'g1', time: '02:00', period: '1T', playerId: 'p1', action: 'goal', tipo: 'gol', subtipo: '' },
        { id: 'g2', time: '04:00', period: '1T', playerId: 'p1', action: 'goal', tipo: 'gol', subtipo: '' },
        { id: 'g3', time: '00:00', period: '2T', playerId: 'p1', action: 'goal', tipo: 'gol', subtipo: '' },
      ],
      teamStats: {
        goals: 3,
        assists: 0,
        passesCorrect: 0,
        passesWrong: 0,
        shotsOnTarget: 0,
        shotsOffTarget: 0,
        tacklesWithBall: 0,
        tacklesWithoutBall: 0,
        tacklesCounterAttack: 0,
        transitionErrors: 0,
        goalTimes: [{ time: '45:10 (2T)' }, { time: '46:00 (2T)' }, { time: '12:00 (1T)' }],
      },
    });
    const fromAggregate = match({
      postMatchEventCount: 3,
      teamStats: {
        ...fromLog.teamStats,
        goalTimes: [{ time: '02:00 (1T)' }, { time: '04:00 (1T)' }, { time: '00:00 (2T)' }],
      },
    });
    expect(countGoalsByPeriod(goalClockStringsFromMatch(fromLog, 'scored'))).toEqual(
      countGoalsByPeriod(goalClockStringsFromMatch(fromAggregate, 'scored'))
    );
  });
});
