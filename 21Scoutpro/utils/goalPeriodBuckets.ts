import type { MatchRecord } from '../types';
import { postMatchEventClockToAbsoluteSeconds, type MatchHalf } from './matchPeriod';

/** Faixas de 5 min (0–50 min) para gols por período — legendas do eixo X. */
export const GOAL_BY_PERIOD_LABELS = [
  '00:00 - 05:00',
  '05:01 - 10:00',
  '10:01 - 15:00',
  '15:01 - 20:00',
  '20:01 - 25:00',
  '25:01 - 30:00',
  '30:01 - 35:00',
  '35:01 - 40:00',
  '40:01 - 45:00',
  '45:01 - 50:00',
] as const;

/**
 * Segundos absolutos a partir do texto agregado "MM:SS (1T|2T)" ou do relógio do lance.
 * Acima de 20:00 no campo de tempo é legado absoluto (planilha), não soma outro tempo.
 */
export function parseAggregatedGoalTimeToTotalSeconds(timeStr: string): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const paren = timeStr.match(/\(([12])T\)\s*$/i);
  if (paren) {
    const clockPart = timeStr.slice(0, timeStr.indexOf('(')).trim();
    const period = (paren[1] === '2' ? '2T' : '1T') as MatchHalf;
    return postMatchEventClockToAbsoluteSeconds(clockPart, period);
  }
  const cleanTime = timeStr.split('(')[0].trim();
  const parts = cleanTime.split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const sec = parseInt(parts[1], 10);
    if (!isNaN(m) && !isNaN(sec) && sec >= 0 && sec <= 59) return m * 60 + sec;
  }
  const mOnly = parseInt(cleanTime, 10);
  return !isNaN(mOnly) ? mOnly * 60 : null;
}

/** Índice 0–9; primeiro bloco [0, 5:00], depois a cada 5 min. */
export function goalPeriodIndexFromTotalSeconds(tSec: number): number | null {
  if (!Number.isFinite(tSec) || tSec < 0) return null;
  const maxSec = 50 * 60;
  if (tSec > maxSec) return null;
  if (tSec <= 300) return 0;
  return Math.min(9, Math.floor((tSec - 1) / 300));
}

function isConcededGoal(event: { isOpponentGoal?: boolean; subtipo?: string }): boolean {
  return event.isOpponentGoal === true || String(event.subtipo ?? '').trim().toUpperCase() === 'CONTRA';
}

/**
 * Relógios de gol no mesmo formato de antes da listagem sem log: "MM:SS (1T|2T)".
 * Com a fita presente, deriva do log (comportamento do getById). Sem a fita, lê o agregado.
 */
export function goalClockStringsFromMatch(match: MatchRecord, kind: 'scored' | 'conceded'): string[] {
  const log = match.postMatchEventLog;
  if (Array.isArray(log)) {
    const clocks: string[] = [];
    for (const event of log) {
      if (event.action !== 'goal' || !event.time) continue;
      const conceded = isConcededGoal(event);
      if (kind === 'conceded' ? !conceded : conceded) continue;
      const period: MatchHalf = event.period === '2T' ? '2T' : '1T';
      clocks.push(`${event.time} (${period})`);
    }
    return clocks;
  }
  const entries = kind === 'scored' ? match.teamStats?.goalTimes : match.teamStats?.goalsConcededTimes;
  return (entries ?? []).map((entry) => entry.time).filter((time) => Boolean(time));
}

export function countGoalsByPeriod(times: string[]): number[] {
  const counts = new Array<number>(GOAL_BY_PERIOD_LABELS.length).fill(0);
  for (const time of times) {
    const tSec = parseAggregatedGoalTimeToTotalSeconds(time);
    if (tSec == null) continue;
    const index = goalPeriodIndexFromTotalSeconds(tSec);
    if (index != null) counts[index] += 1;
  }
  return counts;
}

export function summarizeGoalPeriods(counts: number[]): { maxLabel: string; percentage: string; maxCount: number } {
  let maxIndex = 0;
  for (let i = 1; i < counts.length; i += 1) {
    if (counts[i] > counts[maxIndex]) maxIndex = i;
  }
  const maxCount = counts[maxIndex] ?? 0;
  const total = counts.reduce((sum, count) => sum + count, 0);
  const percentage = total > 0 ? ((maxCount / total) * 100).toFixed(2) : '0.00';
  return {
    maxLabel: GOAL_BY_PERIOD_LABELS[maxIndex] ?? GOAL_BY_PERIOD_LABELS[0],
    percentage,
    maxCount,
  };
}
