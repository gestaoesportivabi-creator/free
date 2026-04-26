/**
 * Lê PSR, PSE e bem-estar diário do localStorage (fontes oficiais atuais)
 * e retorna, por atleta, os valores relevantes para o dia do jogo.
 */

import { normalizeScheduleDays } from './scheduleUtils';
import { parseLocalDateOnly } from './dateUtils';

const PSR_JOGOS_KEY = 'scout21_psr_jogos';
const PSR_TREINOS_KEY = 'scout21_psr_treinos';
const PSE_JOGOS_KEY = 'scout21_pse_jogos';
const PSE_TREINOS_KEY = 'scout21_pse_treinos';
const WELLNESS_KEY = 'scout21_wellness';

type EventWithDate = { date: string; eventKey: string; type: 'treino' | 'jogo' };

function toLocalYmd(dateInput: string | undefined): string | null {
  if (!dateInput || typeof dateInput !== 'string') return null;
  const parsed = parseLocalDateOnly(dateInput);
  if (Number.isNaN(parsed.getTime())) return null;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function compareYmdAsc(a: string, b: string): number {
  return parseLocalDateOnly(a).getTime() - parseLocalDateOnly(b).getTime();
}

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

function getWellness(): Record<string, Record<string, { dor?: number; sono?: number }>> {
  try {
    const raw = localStorage.getItem(WELLNESS_KEY);
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
        const date = toLocalYmd(day?.date || '') || '';
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
    const date = toLocalYmd(m?.date || '');
    if (!m?.id || !date) return;
    list.push({ date, eventKey: m.id, type: 'jogo' });
  });

  list.sort((a, b) => compareYmdAsc(a.date, b.date));
  return list;
}

export interface PlayerPhysiology {
  /** PSR armazenada no dia do jogo (evento do jogo) */
  psrMatchDay: number | null;
  /** PSE da última sessão de treino (inclui treino no dia do jogo) */
  pseAfterLastTraining: number | null;
  /** Qualidade do sono no dia do jogo (evento jogo_${matchDate}) */
  sleepMatchDay: number | null;
  /** Dor muscular no dia do jogo (escala 1 a 5) */
  dorMuscularMatchDay: number | null;
}

/**
 * Para cada playerId, retorna:
 * - psrMatchDay: PSR armazenada no dia do jogo (jogo da data da partida)
 * - pseAfterLastTraining: PSE da última sessão de treino (inclui treino no dia do jogo se for antes do jogo)
 * - sleepMatchDay: qualidade do sono no dia do jogo (sempre via Bem-Estar Diário)
 */
export function getPlayerPhysiologyForMatch(
  matchDate: string,
  playerIds: string[],
  schedules: { days?: unknown[]; isActive?: unknown }[],
  championshipMatches: { id: string; date: string; time?: string; opponent?: string }[],
  matchId?: string
): Record<string, PlayerPhysiology> {
  const normalizedMatchDate = toLocalYmd(matchDate);
  const result: Record<string, PlayerPhysiology> = {};
  playerIds.forEach((id) => {
    result[id] = { psrMatchDay: null, pseAfterLastTraining: null, sleepMatchDay: null, dorMuscularMatchDay: null };
  });
  if (!normalizedMatchDate) return result;

  const psrJogos = getPsrJogos();
  const pseTreinos = getPseTreinos();
  const wellness = getWellness();

  const events = buildEventsWithDates(schedules, championshipMatches);
  const matchDayEvent = events.find((e) => e.date === normalizedMatchDate && e.type === 'jogo');
  const matchEventKey = (typeof matchId === 'string' && matchId.trim()) || matchDayEvent?.eventKey;
  const jogoEventsOnOrBeforeMatch = events
    .filter((e) => e.type === 'jogo' && compareYmdAsc(e.date, normalizedMatchDate) <= 0)
    .sort((a, b) => compareYmdAsc(b.date, a.date));

  // Última sessão de treino: inclui treinos no dia do jogo (ex.: treino de manhã, jogo à noite)
  const treinoEventsOnOrBeforeMatch = events
    .filter((e) => e.type === 'treino' && compareYmdAsc(e.date, normalizedMatchDate) <= 0)
    .sort((a, b) => {
      const byDate = compareYmdAsc(b.date, a.date);
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
    if (result[playerId].psrMatchDay == null) {
      for (const ev of jogoEventsOnOrBeforeMatch) {
        const psrVal = psrJogos[ev.eventKey]?.[pid];
        if (typeof psrVal === 'number' && psrVal >= 0 && psrVal <= 10) {
          result[playerId].psrMatchDay = psrVal;
          break;
        }
      }
    }

    for (const ev of treinoEventsOnOrBeforeMatch) {
      // Compatibilidade: alguns ambientes armazenam PSE treino por sessão
      // (YYYY-MM-DD_HH:mm_Atividade) e outros por bucket diário (YYYY-MM-DD).
      const data = pseTreinos[ev.eventKey] || pseTreinos[ev.date];
      const val = data?.[pid];
      if (typeof val === 'number' && val >= 0 && val <= 10) {
        result[playerId].pseAfterLastTraining = val;
        break;
      }
    }

    const wellnessSleepVal = wellness[normalizedMatchDate]?.[pid]?.sono;
    if (typeof wellnessSleepVal === 'number' && wellnessSleepVal >= 1 && wellnessSleepVal <= 5) {
      result[playerId].sleepMatchDay = wellnessSleepVal;
    }
    if (result[playerId].sleepMatchDay == null) {
      const fallbackWellnessSleepDate = Object.keys(wellness)
        .map((d) => toLocalYmd(d))
        .filter((d): d is string => Boolean(d))
        .filter((d) => compareYmdAsc(d, normalizedMatchDate) <= 0)
        .sort((a, b) => compareYmdAsc(b, a))
        .find((d) => {
          const v = wellness[d]?.[pid]?.sono;
          return typeof v === 'number' && v >= 1 && v <= 5;
        });
      if (fallbackWellnessSleepDate) {
        result[playerId].sleepMatchDay = wellness[fallbackWellnessSleepDate]?.[pid]?.sono ?? null;
      }
    }

    const dorVal = wellness[normalizedMatchDate]?.[pid]?.dor;
    if (typeof dorVal === 'number' && dorVal >= 1 && dorVal <= 5) {
      result[playerId].dorMuscularMatchDay = dorVal;
    }
    if (result[playerId].dorMuscularMatchDay == null) {
      const fallbackDorDate = Object.keys(wellness)
        .map((d) => toLocalYmd(d))
        .filter((d): d is string => Boolean(d))
        .filter((d) => compareYmdAsc(d, normalizedMatchDate) <= 0)
        .sort((a, b) => compareYmdAsc(b, a))
        .find((d) => {
          const v = wellness[d]?.[pid]?.dor;
          return typeof v === 'number' && v >= 1 && v <= 5;
        });
      if (fallbackDorDate) {
        result[playerId].dorMuscularMatchDay = wellness[fallbackDorDate]?.[pid]?.dor ?? null;
      }
    }
  });

  return result;
}
