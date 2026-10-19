import { parseLocalDateOnly } from './dateUtils';
import { fixtureKey } from './reopenRealtimeCollection';

export interface ScheduledFixture {
  id: string;
  date: string;
  opponent: string;
  time?: string;
  jogoId?: string | null;
}

export interface SavedFixtureRef {
  id?: string;
  date?: string;
  opponent?: string;
}

/**
 * Partida da tabela sai de "futuras" quando a data já passou ou quando já
 * existe jogo salvo da mesma data e adversário (ou o jogoId vinculado).
 * A coleta finalizada precisa estar na lista de jogos; a tela que consome
 * isto tem de atualizar essa lista depois de Finalizar.
 */
export function splitChampionshipFixtures<T extends ScheduledFixture>(
  scheduled: T[],
  saved: SavedFixtureRef[],
  today: Date
): { past: T[]; future: T[] } {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);

  const savedKeys = new Set<string>();
  const savedIds = new Set<string>();
  for (const match of saved) {
    const key = fixtureKey(match.date, match.opponent);
    if (key) savedKeys.add(key);
    if (match.id) savedIds.add(String(match.id));
  }

  const past: T[] = [];
  const future: T[] = [];
  for (const match of scheduled) {
    const matchDate = parseLocalDateOnly(match.date);
    if (Number.isNaN(matchDate.getTime())) continue;
    const linkedById = Boolean(match.jogoId && savedIds.has(String(match.jogoId)));
    const linkedByKey = savedKeys.has(fixtureKey(match.date, match.opponent));
    if (matchDate < start || linkedById || linkedByKey) past.push(match);
    else future.push(match);
  }

  past.sort((a, b) => {
    const dateCompare = parseLocalDateOnly(b.date).getTime() - parseLocalDateOnly(a.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return (b.time || '').localeCompare(a.time || '');
  });
  future.sort((a, b) => {
    const dateCompare = parseLocalDateOnly(a.date).getTime() - parseLocalDateOnly(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return (a.time || '').localeCompare(b.time || '');
  });

  return { past, future };
}
