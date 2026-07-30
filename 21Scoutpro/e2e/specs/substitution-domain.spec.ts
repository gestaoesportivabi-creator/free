import { expect, test } from '@playwright/test';
import { applySubstitution } from '../../utils/substitution';

test.describe('domínio puro de substituição', () => {
  test('troca quadra e banco sem mutar a entrada', () => {
    const input = {
      lineup: ['gk', '2', '3', '4', '5'],
      bench: ['6', '7'],
      history: [],
      counts: {},
      currentGoalkeeperId: 'gk',
      playerOutId: '3',
      playerInId: '6',
      time: 321,
      period: '1T' as const,
    };

    const result = applySubstitution(input);

    expect(result.lineup).toEqual(['gk', '2', '6', '4', '5']);
    expect(result.bench).toEqual(['7', '3']);
    expect(result.history).toEqual([
      { playerOutId: '3', playerInId: '6', time: 321, period: '1T' },
    ]);
    expect(result.counts).toEqual({ '3': 1, '6': 1 });
    expect(input.lineup).toEqual(['gk', '2', '3', '4', '5']);
    expect(input.bench).toEqual(['6', '7']);
  });

  test('transfere goleiro e rejeita pares inválidos', () => {
    const result = applySubstitution({
      lineup: ['gk', '2', '3', '4', '5'],
      bench: ['gk2'],
      history: [],
      counts: {},
      currentGoalkeeperId: 'gk',
      playerOutId: 'gk',
      playerInId: 'gk2',
      incomingIsGoalkeeper: true,
      time: 900,
      period: '2T',
    });

    expect(result.currentGoalkeeperId).toBe('gk2');
    expect(() =>
      applySubstitution({
        lineup: ['1', '2'],
        bench: ['3'],
        history: [],
        counts: {},
        currentGoalkeeperId: null,
        playerOutId: '9',
        playerInId: '3',
        time: 1,
        period: '1T',
      })
    ).toThrow(/não está em quadra/i);
  });
});
