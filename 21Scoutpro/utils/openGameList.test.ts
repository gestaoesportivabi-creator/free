import { describe, expect, it } from 'vitest';
import {
  consumeOpenGameList,
  incompleteLiveSaveDestination,
  liveCalendarExitPlan,
  OPEN_GAME_LIST_KEY,
  peekOpenGameList,
  stashOpenGameList,
} from './openGameList';

describe('salvar como incompleta volta à lista de jogos', () => {
  it('voltar ao calendário guarda a coleta e abre a lista de jogos', () => {
    expect(liveCalendarExitPlan({
      isPostmatch: false,
      isMatchStarted: true,
      eventCount: 2,
      clockRunning: false,
    })).toEqual({ saveCollection: true, destination: 'game-list', confirmLeave: false });
    expect(liveCalendarExitPlan({
      isPostmatch: false,
      isMatchStarted: false,
      eventCount: 0,
      clockRunning: false,
    })).toEqual({ saveCollection: false, destination: 'game-list', confirmLeave: false });
    expect(liveCalendarExitPlan({
      isPostmatch: true,
      isMatchStarted: false,
      eventCount: 1,
      clockRunning: true,
    }).saveCollection).toBe(true);
    expect(liveCalendarExitPlan({
      isPostmatch: false,
      isMatchStarted: true,
      eventCount: 1,
      clockRunning: true,
    }).confirmLeave).toBe(true);
    expect(liveCalendarExitPlan({
      isPostmatch: true,
      isMatchStarted: false,
      eventCount: 1,
      clockRunning: true,
    }).confirmLeave).toBe(false);
  });

  it('o botão da tela ao vivo pede a lista, o fechar comum pede a visão geral', () => {
    expect(incompleteLiveSaveDestination(true)).toBe('game-list');
    expect(incompleteLiveSaveDestination(false)).toBe('overview');
  });

  it('o aviso é consumido uma vez ao abrir o dashboard', () => {
    const store = new Map<string, string>();
    const previous = globalThis.localStorage;
    globalThis.localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    } as Storage;

    try {
      expect(peekOpenGameList()).toBe(false);
      stashOpenGameList();
      expect(store.get(OPEN_GAME_LIST_KEY)).toBe('1');
      expect(peekOpenGameList()).toBe(true);
      expect(consumeOpenGameList()).toBe(true);
      expect(consumeOpenGameList()).toBe(false);
    } finally {
      globalThis.localStorage = previous;
    }
  });
});
