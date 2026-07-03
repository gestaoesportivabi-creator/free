/**
 * Carga de fisiologia (staff) — somente API, sem localStorage.
 */

import { wellnessApi } from '../services/api';
import { WeeklySchedule } from '../types';
import { normalizeScheduleDays } from './scheduleUtils';
import { toLocalYmd } from './dateUtils';

export const LEGACY_WELLNESS_LOCAL_KEYS = [
  'scout21_wellness',
  'scout21_pse_jogos',
  'scout21_pse_treinos',
  'scout21_psr_jogos',
  'scout21_psr_treinos',
  'scout21_qualidade_sono',
  'scout21_training_pse',
] as const;

export type NestedPlayerValues = Record<string, Record<string, number>>;

export function clearLegacyWellnessLocalStorage(): void {
  LEGACY_WELLNESS_LOCAL_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  });
}

export function buildScheduleSessionKeysByDate(schedules: WeeklySchedule[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const active = (Array.isArray(schedules) ? schedules : []).filter(
    (s) => s && (s.isActive === true || s.isActive === 'TRUE' || s.isActive === 'true')
  );
  const seen = new Set<string>();
  active.forEach((s) => {
    try {
      const flat = normalizeScheduleDays(s);
      if (!Array.isArray(flat)) return;
      flat.forEach((day) => {
        const act = (day?.activity || '').trim();
        if (act !== 'Treino' && act !== 'Musculação') return;
        const date = day?.date || '';
        const time = day?.time || '00:00';
        if (!date) return;
        const key = `${date}_${time}_${act}`;
        if (seen.has(key)) return;
        seen.add(key);
        if (!out[date]) out[date] = [];
        out[date].push(key);
      });
    } catch {
      /* ignore */
    }
  });
  return out;
}

function mapJogosFromApi(apiRows: unknown): NestedPlayerValues {
  const out: NestedPlayerValues = {};
  if (!Array.isArray(apiRows)) return out;
  apiRows.forEach((item: { jogoId?: string; jogadorId?: string; valor?: number }) => {
    if (!item.jogoId || !item.jogadorId) return;
    if (!out[item.jogoId]) out[item.jogoId] = {};
    out[item.jogoId][item.jogadorId] = Number(item.valor);
  });
  return out;
}

function mapTreinosFromApi(apiRows: unknown, schedules: WeeklySchedule[]): NestedPlayerValues {
  const byDate: NestedPlayerValues = {};
  if (!Array.isArray(apiRows)) return byDate;
  apiRows.forEach((item: { data?: string; jogadorId?: string; valor?: number }) => {
    const date = toLocalYmd(item.data);
    if (!date || !item.jogadorId) return;
    if (!byDate[date]) byDate[date] = {};
    byDate[date][item.jogadorId] = Number(item.valor);
  });

  const scheduleSessionKeysByDate = buildScheduleSessionKeysByDate(schedules);
  const mapped: NestedPlayerValues = {};
  Object.entries(byDate).forEach(([date, byPlayer]) => {
    const sessionKeys = scheduleSessionKeysByDate[date] || [];
    if (sessionKeys.length > 0) {
      mapped[sessionKeys[0]] = { ...(mapped[sessionKeys[0]] || {}), ...byPlayer };
    } else {
      mapped[date] = { ...(mapped[date] || {}), ...byPlayer };
    }
  });
  return mapped;
}

export async function fetchPseJogosFromApi(): Promise<NestedPlayerValues> {
  return mapJogosFromApi(await wellnessApi.getAll('pse-jogo'));
}

export async function fetchPseTreinosFromApi(schedules: WeeklySchedule[]): Promise<NestedPlayerValues> {
  return mapTreinosFromApi(await wellnessApi.getAll('pse-treino'), schedules);
}

export async function fetchPsrJogosFromApi(): Promise<NestedPlayerValues> {
  return mapJogosFromApi(await wellnessApi.getAll('psr-jogo'));
}

export async function fetchPsrTreinosFromApi(schedules: WeeklySchedule[]): Promise<NestedPlayerValues> {
  return mapTreinosFromApi(await wellnessApi.getAll('psr-treino'), schedules);
}

export async function fetchQualidadeSonoFromApi(): Promise<NestedPlayerValues> {
  const apiData = await wellnessApi.getAll('qualidade-sono');
  const out: NestedPlayerValues = {};
  if (!Array.isArray(apiData)) return out;
  apiData.forEach((item: { data?: string; jogadorId?: string; valor?: number }) => {
    const date = toLocalYmd(item.data);
    if (!date || !item.jogadorId) return;
    const eventKey = `treino_${date}`;
    if (!out[eventKey]) out[eventKey] = {};
    out[eventKey][item.jogadorId] = Number(item.valor);
  });
  return out;
}

export type StoredWellness = Record<string, Record<string, Record<string, number>>>;

export async function fetchWellnessFromApi(): Promise<StoredWellness> {
  const apiRows = await wellnessApi.getAll('bem-estar-diario');
  const out: StoredWellness = {};
  if (!Array.isArray(apiRows)) return out;
  apiRows.forEach((row: {
    data?: string;
    jogador_id?: string;
    jogadorId?: string;
    nivel_stress?: number;
    qual_sono?: number;
    humor_mot?: number;
    dor_muscular?: number;
    satisfacao?: number;
  }) => {
    const date = toLocalYmd(row.data);
    const playerId = String(row.jogador_id || row.jogadorId || '');
    if (!date || !playerId) return;
    if (!out[date]) out[date] = {};
    const entry: Record<string, number> = {};
    if (typeof row.nivel_stress === 'number') entry.stress = row.nivel_stress;
    if (typeof row.qual_sono === 'number') entry.sono = row.qual_sono;
    if (typeof row.humor_mot === 'number') entry.humor = row.humor_mot;
    if (typeof row.dor_muscular === 'number') entry.dor = row.dor_muscular;
    if (typeof row.satisfacao === 'number') entry.satisfacao = row.satisfacao;
    if (Object.keys(entry).length > 0) out[date][playerId] = entry;
  });
  return out;
}

export async function fetchAllStaffWellnessFromApi(schedules: WeeklySchedule[]) {
  const [pseJogos, pseTreinos, psrJogos, psrTreinos, qualidadeSono, wellness] = await Promise.all([
    fetchPseJogosFromApi(),
    fetchPseTreinosFromApi(schedules),
    fetchPsrJogosFromApi(),
    fetchPsrTreinosFromApi(schedules),
    fetchQualidadeSonoFromApi(),
    fetchWellnessFromApi(),
  ]);
  return { pseJogos, pseTreinos, psrJogos, psrTreinos, qualidadeSono, wellness };
}
