/** Depois de "Salvar como incompleta" no ao vivo: Dados do Jogo, não a Visão Geral. */
export const OPEN_GAME_LIST_KEY = 'scout21_open_game_list';

export function stashOpenGameList(): void {
  try {
    localStorage.setItem(OPEN_GAME_LIST_KEY, '1');
  } catch {
    /* ignore quota / private mode */
  }
}

export function peekOpenGameList(): boolean {
  try {
    return localStorage.getItem(OPEN_GAME_LIST_KEY) === '1';
  } catch {
    return false;
  }
}

export function consumeOpenGameList(): boolean {
  try {
    if (localStorage.getItem(OPEN_GAME_LIST_KEY) !== '1') return false;
    localStorage.removeItem(OPEN_GAME_LIST_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * A tela ao vivo, ao guardar incompleta, volta para a lista de jogos.
 * Fechar sem esse save continua na visão geral. Finalizar usa outro handoff.
 */
export function incompleteLiveSaveDestination(
  saveAsIncomplete: boolean
): 'game-list' | 'overview' {
  return saveAsIncomplete ? 'game-list' : 'overview';
}
