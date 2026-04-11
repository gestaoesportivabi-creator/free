import type { WeeklySchedule } from '../types';

/** Primeiro `equipeId` válido nas programações (API deve enviar; evita fallback inválido na API de wellness). */
export function resolveEquipeIdFromSchedules(schedules: WeeklySchedule[]): string | undefined {
  const id = schedules.map(s => s.equipeId).find(e => typeof e === 'string' && e.trim().length > 0);
  return id?.trim();
}
