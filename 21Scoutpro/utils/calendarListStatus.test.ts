import { describe, expect, it } from 'vitest';
import { calendarBadgeForSavedMatch, calendarBadgeForScheduled } from './calendarListStatus';

const zeroStats = {
  goals: 0,
  goalsConceded: 0,
  assists: 0,
  passesCorrect: 0,
  passesWrong: 0,
  shotsOnTarget: 0,
  shotsOffTarget: 0,
  tacklesWithBall: 0,
  tacklesWithoutBall: 0,
  tacklesCounterAttack: 0,
  transitionErrors: 0,
};

describe('selo do calendário', () => {
  it('agenda recém-criada, sem coleta, fica disponível', () => {
    expect(calendarBadgeForScheduled(null)).toBe('disponivel');
    expect(calendarBadgeForScheduled(undefined)).toBe('disponivel');
  });

  it('em andamento sem fita, sem relógio e sem estatística fica disponível', () => {
    expect(
      calendarBadgeForSavedMatch({
        status: 'em_andamento',
        postMatchEventCount: 0,
        postMatchEventLog: [],
        playerStats: {},
        teamStats: zeroStats,
        lineup: { clockSnapshot: { state: 'PRE_JOGO' } },
      })
    ).toBe('disponivel');
    expect(
      calendarBadgeForScheduled({
        status: 'em_andamento',
        playerStats: {},
        teamStats: zeroStats,
      })
    ).toBe('disponivel');
  });

  it('coleta em andamento continua incompleta', () => {
    expect(
      calendarBadgeForSavedMatch({
        status: 'em_andamento',
        postMatchEventCount: 4,
        playerStats: {},
        teamStats: zeroStats,
      })
    ).toBe('incompleto');
    expect(
      calendarBadgeForSavedMatch({
        status: 'em_andamento',
        playerStats: {},
        teamStats: zeroStats,
        lineup: { clockSnapshot: { state: 'PAUSADO' } },
      })
    ).toBe('incompleto');
    expect(
      calendarBadgeForSavedMatch({
        status: 'em_andamento',
        playerStats: {},
        teamStats: { ...zeroStats, passesCorrect: 12 },
      })
    ).toBe('incompleto');
  });

  it('em andamento com relógio encerrado e fita continua incompleto até o técnico finalizar', () => {
    expect(
      calendarBadgeForSavedMatch({
        status: 'em_andamento',
        postMatchEventCount: 21,
        lineup: { clockSnapshot: { state: 'ENCERRADO' } },
      })
    ).toBe('incompleto');
  });

  it('disponível com relógio encerrado e fita conta como finalizado', () => {
    expect(
      calendarBadgeForSavedMatch({
        status: 'disponivel',
        postMatchEventCount: 21,
        lineup: { clockSnapshot: { state: 'ENCERRADO' } },
      })
    ).toBe('finalizado');
  });

  it('encerrado continua finalizado mesmo sem estatística nova', () => {
    expect(
      calendarBadgeForSavedMatch({
        status: 'encerrado',
        postMatchEventCount: 0,
        playerStats: {},
        teamStats: zeroStats,
      })
    ).toBe('finalizado');
    expect(
      calendarBadgeForScheduled({
        status: 'encerrado',
        postMatchEventCount: 12,
        lineup: { clockSnapshot: { state: 'ENCERRADO' } },
      })
    ).toBe('finalizado');
  });
});
