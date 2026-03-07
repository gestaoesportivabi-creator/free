/**
 * Utilitário para rastrear cartões de jogadores por campeonato
 * Armazena em localStorage: championship_cards_{championshipId}
 */

export interface PlayerCardRecord {
  yellows: number;
  reds: number;
  redSuspensionGamesRemaining: number;  // Jogos restantes de suspensão por vermelho
  yellowSuspensionGamesRemaining: number; // Jogos restantes de suspensão por acumulação
}

const STORAGE_PREFIX = 'championship_cards_';

function getStorageKey(championshipId: string): string {
  return `${STORAGE_PREFIX}${championshipId}`;
}

export function getChampionshipCards(championshipId: string): Record<string, PlayerCardRecord> {
  try {
    const data = localStorage.getItem(getStorageKey(championshipId));
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function setChampionshipCards(championshipId: string, cards: Record<string, PlayerCardRecord>): void {
  localStorage.setItem(getStorageKey(championshipId), JSON.stringify(cards));
}

/**
 * Atualiza cartões após salvar uma partida
 * 1. Decrementa suspensões em andamento (jogo servido)
 * 2. Adiciona cartões desta partida
 * 3. Aplica novas suspensões se necessário
 */
export function updateCardsFromMatch(
  championshipId: string,
  playerStats: Record<string, { yellowCards?: number; redCards?: number }>,
  suspensionRules: { yellowCardsForSuspension: number; redCardSuspension: number; yellowAccumulationSuspension: number }
): void {
  const cards = getChampionshipCards(championshipId);

  // 1. Decrementar suspensões em andamento (todos que tinham pendência serviram 1 jogo)
  Object.keys(cards).forEach(playerId => {
    const r = cards[playerId];
    if (r.redSuspensionGamesRemaining > 0) r.redSuspensionGamesRemaining--;
    if (r.yellowSuspensionGamesRemaining > 0) r.yellowSuspensionGamesRemaining--;
  });

  // 2 e 3. Adicionar cartões desta partida e aplicar suspensões
  Object.entries(playerStats || {}).forEach(([playerId, stats]) => {
    const yellows = stats.yellowCards ?? 0;
    const reds = stats.redCards ?? 0;
    if (yellows === 0 && reds === 0) return;

    const current = cards[playerId] || {
      yellows: 0,
      reds: 0,
      redSuspensionGamesRemaining: 0,
      yellowSuspensionGamesRemaining: 0,
    };

    let newYellows = current.yellows + yellows;
    let newReds = current.reds + reds;
    let newRedRemaining = current.redSuspensionGamesRemaining;
    let newYellowRemaining = current.yellowSuspensionGamesRemaining;

    // Vermelho direto = suspensão
    if (reds > 0) {
      newRedRemaining = suspensionRules.redCardSuspension;
    }

    // 2 amarelos = vermelho automático
    if (yellows >= 2) {
      newRedRemaining = suspensionRules.redCardSuspension;
      newYellows = 0;
    } else if (yellows >= 1 && newYellows >= suspensionRules.yellowCardsForSuspension) {
      newYellowRemaining = suspensionRules.yellowAccumulationSuspension;
      newYellows = 0;
    }

    cards[playerId] = {
      yellows: newYellows,
      reds: newReds,
      redSuspensionGamesRemaining: newRedRemaining,
      yellowSuspensionGamesRemaining: newYellowRemaining,
    };
  });

  setChampionshipCards(championshipId, cards);
}

/**
 * Verifica se jogador está suspenso ou pendurado
 */
export function getPlayerStatus(
  championshipId: string,
  playerId: string,
  rules: { yellowCardsForSuspension: number }
): { suspended: boolean; pendurado: boolean; yellows: number } {
  const cards = getChampionshipCards(championshipId);
  const record = cards[playerId];
  if (!record) return { suspended: false, pendurado: false, yellows: 0 };

  const suspended = record.redSuspensionGamesRemaining > 0 || record.yellowSuspensionGamesRemaining > 0;
  const pendurado = !suspended && record.yellows >= rules.yellowCardsForSuspension - 1 && record.yellows > 0;

  return { suspended, pendurado, yellows: record.yellows };
}
