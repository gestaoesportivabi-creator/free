/**
 * Utilitários para normalizar dados de programação entre formatos
 * - Formato flat: cada linha = um evento (ScheduleDay)
 * - Formato agrupado: dias com array de atividades (DaySchedule)
 */

import { ScheduleDay, DaySchedule, WeeklySchedule } from '../types';

/**
 * Converte formato agrupado (API) para formato flat (Schedule component)
 */
export function normalizeScheduleDays(schedule: WeeklySchedule): ScheduleDay[] {
  if (!schedule.days || !Array.isArray(schedule.days)) return [];

  const flat: ScheduleDay[] = [];

  for (const item of schedule.days) {
    // Já está no formato flat (ScheduleDay)
    if ('date' in item && 'time' in item && 'activity' in item) {
      flat.push(item as ScheduleDay);
      continue;
    }

    // Formato agrupado (DaySchedule)
    const daySchedule = item as DaySchedule;
    const date = daySchedule.date || '';
    const weekday = daySchedule.day || '';

    if (!daySchedule.activities || !Array.isArray(daySchedule.activities)) continue;

    for (const act of daySchedule.activities) {
      flat.push({
        date,
        weekday,
        time: act.time || '',
        activity: act.activity || '',
        location: act.location || '',
        notes: act.notes,
        carga: act.carga,
        cargaPercent: act.cargaPercent,
        exerciseName: act.exerciseName,
      });
    }
  }

  // Ordenar por data e horário
  flat.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return (a.time || '00:00').localeCompare(b.time || '00:00');
  });

  return flat;
}

/**
 * Garante que WeeklySchedule tenha startDate/endDate e days no formato flat
 */
export function normalizeWeeklySchedule(schedule: WeeklySchedule): WeeklySchedule {
  const startDate = schedule.startDate || schedule.weekStart || '';
  const endDate = schedule.endDate || schedule.weekEnd || '';
  const flatDays = normalizeScheduleDays(schedule);

  return {
    ...schedule,
    startDate,
    endDate,
    weekStart: startDate,
    weekEnd: endDate,
    days: flatDays,
  };
}
