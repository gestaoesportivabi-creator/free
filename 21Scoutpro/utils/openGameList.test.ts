import { describe, expect, it } from 'vitest';
import {
  consumeOpenGameList,
  incompleteLiveSaveDestination,
  OPEN_GAME_LIST_KEY,
  peekOpenGameList,
  stashOpenGameList,
} from './openGameList';

describe('salvar como incompleta volta à lista de jogos', () => {
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
