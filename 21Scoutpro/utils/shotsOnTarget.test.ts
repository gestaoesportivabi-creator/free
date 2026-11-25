import { describe, expect, it } from 'vitest';
import type { MatchRecord, MatchStats } from '../types';
import {
  applyDerivedShotsOnTarget,
  countShotsOnTarget,
  shotResultToAction,
} from './shotsOnTarget';

const emptyStats = (): MatchStats => ({
  goals: 1,
  assists: 0,
  passesCorrect: 0,
  passesWrong: 0,
  shotsOnTarget: 2,
  shotsOffTarget: 1,
  tacklesWithBall: 0,
  tacklesWithoutBall: 0,
  tacklesCounterAttack: 0,
  transitionErrors: 0,
});

/** 1 No gol, 1 Fora, 1 Trave e 1 GOL nosso — a trave foi persistida como shotOn. */
const scenarioLog = [
  {
    id: 's1',
    time: '01:00',
    period: '1T' as const,
    playerId: 'p1',
    action: 'shotOn' as const,
    tipo: 'Finalização',
    subtipo: 'No gol',
    result: 'inside',
  },
  {
    id: 's2',
    time: '02:00',
    period: '1T' as const,
    playerId: 'p1',
    action: 'shotOff' as const,
    tipo: 'Finalização',
    subtipo: 'Pra fora',
    result: 'outside',
  },
  {
    id: 's3',
    time: '03:00',
    period: '1T' as const,
    playerId: 'p1',
    action: 'shotOn' as const,
    tipo: 'Finalização',
    subtipo: 'Trave',
    result: 'post',
  },
  {
    id: 's4',
    time: '04:00',
    period: '1T' as const,
    playerId: 'p1',
    action: 'goal' as const,
    tipo: 'Gol',
    subtipo: 'A favor',
  },
];

describe('chutes no gol', () => {
  it('conta 1 no cenário no gol, fora, trave e gol', () => {
    const count = countShotsOnTarget(scenarioLog);
    expect(count.team).toBe(1);
    expect(count.byPlayer.p1).toBe(1);
  });

  it('a trave não vira chute no gol na coleta', () => {
    expect(shotResultToAction('inside')).toBe('shotOn');
    expect(shotResultToAction('outside')).toBe('shotOff');
    expect(shotResultToAction('post')).toBe('shotPost');
    expect(shotResultToAction('blocked')).toBe('shotZonaChute');
  });

  it('a análise usa o log e ignora o 2 gravado', () => {
    const match = {
      id: 'm1',
      opponent: 'Rival',
      date: '2026-04-01',
      result: 'V',
      goalsFor: 1,
      goalsAgainst: 0,
      teamStats: emptyStats(),
      playerStats: { p1: emptyStats() },
      postMatchEventLog: scenarioLog,
    } as MatchRecord;

    const derived = applyDerivedShotsOnTarget(match);
    expect(derived.teamStats.shotsOnTarget).toBe(1);
    expect(derived.playerStats.p1.shotsOnTarget).toBe(1);
    expect(derived.teamStats.shotsOffTarget).toBe(1);
    expect(derived.teamStats.goals).toBe(1);
  });
});
