/**
 * Adapter para transformar dados de programações do PostgreSQL para formato WeeklySchedule do frontend
 * Aplicar ajuste recomendado da Seção 11.2.C (item 14)
 */

import { WeeklySchedule, DaySchedule } from '../types/frontend';

// Tipos do banco de dados (Prisma retorna camelCase)
interface ProgramacaoDB {
  id: string;
  equipeId: string;
  titulo: string;
  dataInicio: Date | string;
  dataFim: Date | string;
  isAtivo: boolean;
  createdAt: Date | string;
}

interface ProgramacaoDiaDB {
  id: string;
  programacaoId: string;
  data: Date | string;
  diaSemana?: string | null;
  diaSemanaNumero?: number | null;
  atividade?: string | null;
  horario?: string | null;
  localizacao?: string | null;
  observacoes?: string | null;
  exercicioId?: string | null;
  cargaPercent?: number | null;
  createdAt: Date | string;
}

/**
 * Formata data para string YYYY-MM-DD
 */
function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    return date.split('T')[0]; // Remove hora se houver
  }
  return date.toISOString().split('T')[0];
}

/**
 * Transforma programação do banco de dados para formato WeeklySchedule do frontend
 */
export function transformScheduleToFrontend(
  programacao: ProgramacaoDB,
  dias: ProgramacaoDiaDB[]
): WeeklySchedule {
  // Agrupar dias por data (ou dia da semana)
  const daysMap = new Map<string, DaySchedule>();

  dias.forEach((dia) => {
    const dateKey = formatDate(dia.data);
    const dayName = dia.diaSemana || getDayName(dia.diaSemanaNumero);

    if (!daysMap.has(dateKey)) {
      daysMap.set(dateKey, {
        day: dayName,
        date: dateKey,  // Incluir data para não perder
        activities: [],
      });
    }

    const daySchedule = daysMap.get(dateKey)!;
    daySchedule.activities.push({
      time: dia.horario || '',
      activity: dia.atividade || '',
      location: dia.localizacao || '',
      notes: dia.observacoes || undefined,
      carga: dia.cargaPercent ?? undefined,
      cargaPercent: dia.cargaPercent ?? undefined,
      exerciseName: dia.exercicioId || undefined,
    });
  });

  // Converter Map para array e ordenar por data
  const daysArray: DaySchedule[] = Array.from(daysMap.values()).sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    return dateA.localeCompare(dateB);
  });

  // Converter createdAt para timestamp
  const createdAt = typeof programacao.createdAt === 'string'
    ? new Date(programacao.createdAt).getTime()
    : programacao.createdAt.getTime();

  return {
    id: programacao.id,
    title: programacao.titulo,
    weekStart: formatDate(programacao.dataInicio),
    weekEnd: formatDate(programacao.dataFim),
    days: daysArray,
    isActive: programacao.isAtivo,
    createdAt,
  };
}

/**
 * Retorna nome do dia da semana baseado no número (0=Dom, 6=Sáb)
 */
function getDayName(dayNumber?: number | null): string {
  if (dayNumber === undefined || dayNumber === null) return '';
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[dayNumber] || '';
}

/**
 * Transforma array de programações para formato do frontend
 */
export function transformSchedulesToFrontend(
  programacoes: ProgramacaoDB[],
  diasMap: Map<string, ProgramacaoDiaDB[]>
): WeeklySchedule[] {
  return programacoes.map((programacao) => {
    const dias = diasMap.get(programacao.id) || [];
    return transformScheduleToFrontend(programacao, dias);
  });
}

