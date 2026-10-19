import { parseLocalDateOnly } from './dateUtils';
import { selectSavedForFixture, type CollectedMatchRef } from './reopenRealtimeCollection';

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
  competition?: string;
  time?: string;
  kickoffTime?: string;
  status?: string;
  postMatchEventCount?: number;
  postMatchEventLog?: unknown[] | null;
  lineup?: { kickoffTime?: string; clockSnapshot?: unknown } | null;
}

/**
 * Partida da tabela sai de "futuras" quando a data já passou ou quando o
 * card tem jogoId / o mesmo horário de uma coleta salva.
 * Dois horários no mesmo dia não se arrastam. Sem hora para decidir, o card fica.
 */
export function splitChampionshipFixtures<T extends ScheduledFixture>(
  scheduled: T[],
  saved: SavedFixtureRef[],
  today: Date
): { past: T[]; future: T[] } {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);

  const past: T[] = [];
  const future: T[] = [];
  for (const match of scheduled) {
    const matchDate = parseLocalDateOnly(match.date);
    if (Number.isNaN(matchDate.getTime())) continue;
    const linked = selectSavedForFixture(
      {
        date: match.date,
        opponent: match.opponent,
        time: match.time,
        jogoId: match.jogoId,
      },
      saved as CollectedMatchRef[],
      { scheduled }
    );
    if (matchDate < start || linked) past.push(match);
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
