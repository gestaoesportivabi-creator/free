import { describe, expect, it } from 'vitest';
import type { MatchRecord, PostMatchEvent } from '../types';
import { verifyPostMatchEventLog } from './verifyPostMatchEventLog';

function event(id: string): PostMatchEvent {
  return { id, time: '01:00', period: '1T', playerId: 'p1', action: 'goal', tipo: 'gol', subtipo: '' };
}

function match(partial: Partial<MatchRecord> & Pick<MatchRecord, 'id'>): MatchRecord {
  return {
    date: '2026-10-19',
    opponent: 'J2-1',
    result: 'V',
    goalsFor: 1,
    goalsAgainst: 0,
    playerStats: {},
    teamStats: {
      goals: 1,
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
    postMatchEventLog: [event('e1'), event('e2')],
    ...partial,
  };
}

describe('verifyPostMatchEventLog', () => {
  it('GET 404 não descarta a coleta local nem troca o id', async () => {
    const saved = match({ id: 'jogo-1' });
    const result = await verifyPostMatchEventLog(saved, 2, async () => null);
    expect(result.status).toBe('unavailable');
    expect(result.match).toBe(saved);
    expect(result.match.postMatchEventLog).toHaveLength(2);
    expect(result.match.id).toBe('jogo-1');
  });

  it('GET que lança mantém o payload do PUT', async () => {
    const saved = match({ id: 'jogo-1' });
    const result = await verifyPostMatchEventLog(saved, 2, async () => {
      throw new Error('Estatísticas do jogo com ID jogo-1 não encontrado');
    });
    expect(result.status).toBe('unavailable');
    expect(result.match.postMatchEventLog?.map((item) => item.id)).toEqual(['e1', 'e2']);
  });

  it('fita mais curta no GET não substitui a coleta enviada', async () => {
    const saved = match({ id: 'jogo-1' });
    const result = await verifyPostMatchEventLog(
      saved,
      2,
      async () => match({ id: 'jogo-1', postMatchEventLog: [event('e1')] })
    );
    expect(result.status).toBe('shorter');
    expect(result.serverLogLength).toBe(1);
    expect(result.match.postMatchEventLog).toHaveLength(2);
  });

  it('GET confirmado pode adotar a fita do servidor quando ela cobre o envio', async () => {
    const saved = match({ id: 'jogo-1', opponent: 'local' });
    const result = await verifyPostMatchEventLog(
      saved,
      2,
      async () => match({ id: 'jogo-1', opponent: 'servidor', postMatchEventLog: [event('e1'), event('e2')] })
    );
    expect(result.status).toBe('confirmed');
    expect(result.match.opponent).toBe('servidor');
    expect(result.match.postMatchEventLog).toHaveLength(2);
  });
});
