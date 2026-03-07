/**
 * Lê PSR, PSE e qualidade do sono do localStorage (mesmas chaves das abas de fisiologia)
 * e retorna, por atleta, os valores relevantes para o dia do jogo.
 */

import { normalizeScheduleDays } from './scheduleUtils';

const PSR_JOGOS_KEY = 'scout21_psr_jogos';
const PSR_TREINOS_KEY = 'scout21_psr_treinos';
const PSE_JOGOS_KEY = 'scout21_pse_jogos';
const PSE_TREINOS_KEY = 'scout21_pse_treinos';
const QUALIDADE_SONO_KEY = 'scout21_qualidade_sono';

type EventWithDate = { date: string; eventKey: string; type: 'treino' | 'jogo' };

function getPsrJogos(): Record<string, Record<string, number>> {
  try {
    const raw = localStorage.getItem(PSR_JOGOS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getPsrTreinos(): Record<string, Record<string, number>> {
  try {
    const raw = localStorage.getItem(PSR_TREINOS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getPseTreinos(): Record<string, Record<string, number>> {
  try {
    const raw = localStorage.getItem(PSE_TREINOS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getQualidadeSono(): Record<string, Record<string, number>> {
  try {
    const raw = localStorage.getItem(QUALIDADE_SONO_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function buildEventsWithDates(
  schedules: { days?: unknown[]; isActive?: unknown }[],
  championshipMatches: { id: string; date: string; time?: string; opponent?: string }[]
): EventWithDate[] {
  const list: EventWithDate[] = [];
  const seenTreino = new Set<string>();

  const active = (schedules || []).filter(
    (s) => s && (s.isActive === true || s.isActive === 'TRUE' || s.isActive === 'true')
  );

  active.forEach((s) => {
    try {
      const flat = normalizeScheduleDays(s as any);
      if (!Array.isArray(flat)) return;
      flat.forEach((day: any) => {
        const act = (day?.activity || '').trim();
        if (act !== 'Treino' && act !== 'Musculação') return;
        const date = day?.date || '';
        const time = day?.time || '00:00';
        const sessionKey = `${date}_${time}_${act}`;
        if (!date || seenTreino.has(sessionKey)) return;
        seenTreino.add(sessionKey);
        list.push({ date, eventKey: sessionKey, type: 'treino' });
      });
    } catch {
      // ignore
    }
  });

  (championshipMatches || []).forEach((m) => {
    if (!m?.id || !m?.date) return;
    list.push({ date: m.date, eventKey: m.id, type: 'jogo' });
  });

  list.sort((a, b) => a.date.localeCompare(b.date));
  return list;
}

export interface PlayerPhysiology {
  /** PSR armazenada no dia do jogo (evento do jogo) */
  psrMatchDay: number | null;
  /** PSE da última sessão de treino (inclui treino no dia do jogo) */
  pseAfterLastTraining: number | null;
  /** Qualidade do sono no dia do jogo (evento jogo_${matchDate}) */
  sleepMatchDay: number | null;
}

/**
 * Para cada playerId, retorna:
 * - psrMatchDay: PSR armazenada no dia do jogo (jogo da data da partida)
 * - pseAfterLastTraining: PSE da última sessão de treino (inclui treino no dia do jogo se for antes do jogo)
 * - sleepMatchDay: qualidade do sono no dia do jogo
 */
export function getPlayerPhysiologyForMatch(
  matchDate: string,
  playerIds: string[],
  schedules: { days?: unknown[]; isActive?: unknown }[],
  championshipMatches: { id: string; date: string; time?: string; opponent?: string }[]
): Record<string, PlayerPhysiology> {
  const result: Record<string, PlayerPhysiology> = {};
  playerIds.forEach((id) => {
    result[id] = { psrMatchDay: null, pseAfterLastTraining: null, sleepMatchDay: null };
  });

  const psrJogos = getPsrJogos();
  const pseTreinos = getPseTreinos();
  const sono = getQualidadeSono();

  const events = buildEventsWithDates(schedules, championshipMatches);
  const matchDayEvent = events.find((e) => e.date === matchDate && e.type === 'jogo');
  const matchEventKey = matchDayEvent?.eventKey;

  // Última sessão de treino: inclui treinos no dia do jogo (ex.: treino de manhã, jogo à noite)
  const treinoEventsOnOrBeforeMatch = events
    .filter((e) => e.type === 'treino' && e.date <= matchDate)
    .sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      if (byDate !== 0) return byDate;
      return b.eventKey.localeCompare(a.eventKey);
    });

  playerIds.forEach((playerId) => {
    const pid = String(playerId).trim();

    if (matchEventKey) {
      const psrVal = psrJogos[matchEventKey]?.[pid];
      if (typeof psrVal === 'number' && psrVal >= 0 && psrVal <= 10) {
        result[playerId].psrMatchDay = psrVal;
      }
    }

    for (const ev of treinoEventsOnOrBeforeMatch) {
      const data = pseTreinos[ev.eventKey];
      const val = data?.[pid];
      if (typeof val === 'number' && val >= 0 && val <= 10) {
        result[playerId].pseAfterLastTraining = val;
        break;
      }
    }

    const sleepEventKey = `jogo_${matchDate}`;
    const sleepVal = sono[sleepEventKey]?.[pid];
    if (typeof sleepVal === 'number' && sleepVal >= 1 && sleepVal <= 5) {
      result[playerId].sleepMatchDay = sleepVal;
    }
  });

  return result;
}
