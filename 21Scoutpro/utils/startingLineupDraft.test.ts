import { describe, expect, it } from 'vitest';
import { calendarBadgeForSavedMatch } from './calendarListStatus';
import {
  buildStartingLineupSave,
  prepSquadIdsFromLineup,
  shouldPersistStartingLineup,
  statusForLineupDraft,
} from './startingLineupDraft';

const zeroStats = {
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
};

describe('escalação sem relógio', () => {
  it('grava os cinco titulares e o elenco da preparação, sem relógio e sem fita', () => {
    const saved = buildStartingLineupSave({
      matchId: 'sched-agenda-1',
      opponent: 'Rival QA Disp',
      date: '2026-10-19',
      competition: 'Amistoso',
      status: 'disponivel',
      players: ['gk', '3', '4', '5', '6'],
      bench: ['7', 'gk'],
      selectedPlayerIds: ['gk', '3', '4', '5', '6', '7'],
      kickoffTime: '20:00',
    });

    expect(saved.status).toBe('disponivel');
    expect(saved.collectionPhase).toBe(0);
    expect(saved.postMatchEventLog).toBeUndefined();
    expect(saved.lineup?.clockSnapshot).toBeUndefined();
    expect(saved.lineup?.ballPossessionStart).toBeUndefined();
    expect(saved.lineup?.players).toEqual(['gk', '3', '4', '5', '6']);
    expect(saved.lineup?.bench).toEqual(['7']);
    expect(saved.lineup?.selectedPlayerIds).toEqual(['gk', '3', '4', '5', '6', '7']);
    expect(saved.lineup?.kickoffTime).toBe('20:00');
  });

  it('encerrado não regride e em andamento não vira disponível no PUT', () => {
    expect(statusForLineupDraft('encerrado')).toBe('encerrado');
    expect(statusForLineupDraft('em_andamento')).toBe('em_andamento');
    expect(statusForLineupDraft('disponivel')).toBe('disponivel');
    expect(statusForLineupDraft('nao_executado')).toBe('disponivel');
    expect(statusForLineupDraft(undefined)).toBe('disponivel');
    expect(buildStartingLineupSave({
      matchId: 'jogo-encerrado',
      opponent: 'Rival',
      date: '2026-10-19',
      status: 'encerrado',
      players: ['1', '2', '3', '4', '5'],
      bench: [],
    }).status).toBe('encerrado');
  });

  it('persiste ao completar 5/5 e também uma remoção depois da primeira gravação', () => {
    expect(shouldPersistStartingLineup({
      isPostmatch: false,
      isMatchStarted: false,
      eventCount: 0,
      playerCount: 5,
      alreadySaved: false,
    })).toBe(true);
    expect(shouldPersistStartingLineup({
      isPostmatch: false,
      isMatchStarted: false,
      eventCount: 0,
      playerCount: 4,
      alreadySaved: false,
    })).toBe(false);
    expect(shouldPersistStartingLineup({
      isPostmatch: false,
      isMatchStarted: false,
      eventCount: 0,
      playerCount: 4,
      alreadySaved: true,
    })).toBe(true);
    expect(shouldPersistStartingLineup({
      isPostmatch: false,
      isMatchStarted: true,
      eventCount: 0,
      playerCount: 5,
      alreadySaved: false,
    })).toBe(false);
    expect(shouldPersistStartingLineup({
      isPostmatch: false,
      isMatchStarted: false,
      eventCount: 2,
      playerCount: 5,
      alreadySaved: true,
    })).toBe(false);
  });

  it('a preparação reabre pelos convocados e, sem eles, pelos titulares', () => {
    expect(prepSquadIdsFromLineup({
      players: ['gk', '3', '4', '5', '6'],
      selectedPlayerIds: ['gk', '3', '4', '5', '6', '7'],
    })).toEqual(['gk', '3', '4', '5', '6', '7']);
    expect(prepSquadIdsFromLineup({ players: ['gk', '3', '4', '5', '6'] })).toEqual([
      'gk',
      '3',
      '4',
      '5',
      '6',
    ]);
    expect(prepSquadIdsFromLineup(null)).toEqual([]);
  });

  it('escalação sozinha não tira o selo Disponível', () => {
    expect(calendarBadgeForSavedMatch({
      status: 'disponivel',
      postMatchEventCount: 0,
      postMatchEventLog: [],
      playerStats: {},
      teamStats: zeroStats,
      lineup: {
        players: ['gk', '3', '4', '5', '6'],
        selectedPlayerIds: ['gk', '3', '4', '5', '6'],
      },
    })).toBe('disponivel');
    expect(calendarBadgeForSavedMatch({
      status: 'em_andamento',
      postMatchEventCount: 0,
      playerStats: {},
      teamStats: zeroStats,
      lineup: { players: ['gk', '3', '4', '5', '6'] },
    })).toBe('disponivel');
    expect(calendarBadgeForSavedMatch({
      status: 'encerrado',
      postMatchEventCount: 0,
      playerStats: {},
      teamStats: zeroStats,
      lineup: { players: ['gk', '3', '4', '5', '6'] },
    })).toBe('finalizado');
  });
});
