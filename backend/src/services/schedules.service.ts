/**
 * Service para Programações
 */

import { TenantInfo } from '../utils/tenant.helper';
import { schedulesRepository } from '../repositories/schedules.repository';
import { transformScheduleToFrontend } from '../adapters/schedule.adapter';
import { WeeklySchedule } from '../types/frontend';
import { NotFoundError } from '../utils/errors';

/** Converte linha flat (ScheduleDay) ou atividade agrupada para formato do banco */
function parseScheduleDay(item: any): { date: string; weekday: string; time: string; activity: string; location: string; notes?: string; exercicioId?: string; cargaPercent?: number }[] {
  const rows: { date: string; weekday: string; time: string; activity: string; location: string; notes?: string; exercicioId?: string; cargaPercent?: number }[] = [];
  if (item.date && item.time && item.activity) {
    rows.push({
      date: item.date,
      weekday: item.weekday || '',
      time: item.time,
      activity: item.activity,
      location: item.location || '',
      notes: item.notes,
      exercicioId: item.exerciseName || undefined,
      cargaPercent: item.cargaPercent && item.cargaPercent > 0 ? item.cargaPercent : undefined,
    });
  } else if (item.activities && Array.isArray(item.activities)) {
    const date = item.date || '';
    const weekday = item.day || '';
    for (const act of item.activities) {
      rows.push({
        date,
        weekday,
        time: act.time || '',
        activity: act.activity || '',
        location: act.location || '',
        notes: act.notes,
        exercicioId: act.exerciseName || undefined,
        cargaPercent: act.cargaPercent && act.cargaPercent > 0 ? act.cargaPercent : undefined,
      });
    }
  }
  return rows;
}

export const schedulesService = {
  /**
   * Buscar todas as programações do tenant
   */
  async getAll(tenantInfo: TenantInfo): Promise<WeeklySchedule[]> {
    const programacoes = await schedulesRepository.findAll(tenantInfo);
    
    if (programacoes.length === 0) {
      return [];
    }

    const schedules: WeeklySchedule[] = [];
    
    for (const programacao of programacoes) {
      const dias = await schedulesRepository.findDias(programacao.id);
      schedules.push(
        transformScheduleToFrontend(
          programacao as any,
          dias as any
        )
      );
    }

    return schedules;
  },

  /**
   * Buscar programação por ID
   */
  async getById(id: string, tenantInfo: TenantInfo): Promise<WeeklySchedule> {
    const programacao = await schedulesRepository.findById(id, tenantInfo);
    
    if (!programacao) {
      throw new NotFoundError('Programação', id);
    }

    const dias = await schedulesRepository.findDias(id);

    return transformScheduleToFrontend(
      programacao as any,
      dias as any
    );
  },

  /**
   * Criar programação (aceita formato do frontend)
   */
  async create(data: any, tenantInfo: TenantInfo): Promise<WeeklySchedule> {
    const equipeIds = tenantInfo.equipe_ids || [];
    const equipeId = data.equipeId || equipeIds[0];
    
    if (!equipeId || !equipeIds.includes(equipeId)) {
      throw new NotFoundError('Equipe', data.equipeId || equipeIds[0] || '');
    }

    const dataInicio = data.dataInicio ? new Date(data.dataInicio) : new Date(data.startDate || data.weekStart);
    const dataFim = data.dataFim ? new Date(data.dataFim) : new Date(data.endDate || data.weekEnd);
    const titulo = data.titulo || data.title || `Programação ${dataInicio.toLocaleDateString('pt-BR')} a ${dataFim.toLocaleDateString('pt-BR')}`;

    const programacao = await schedulesRepository.create({
      equipeId,
      titulo,
      dataInicio,
      dataFim,
      isAtivo: data.isActive ?? data.isAtivo ?? false,
    });

    // Persistir dias
    const days = data.days || [];
    for (const item of days) {
      const rows = parseScheduleDay(item);
      for (const row of rows) {
        if (row.date && row.activity) {
          await schedulesRepository.createDia({
            programacaoId: programacao.id,
            data: new Date(row.date),
            diaSemana: row.weekday || undefined,
            atividade: row.activity,
            horario: row.time || undefined,
            localizacao: row.location || undefined,
            observacoes: row.notes,
          });
        }
      }
    }

    const diasCriados = await schedulesRepository.findDias(programacao.id);
    return transformScheduleToFrontend(programacao as any, diasCriados as any);
  },

  /**
   * Atualizar programação (aceita formato do frontend)
   */
  async update(id: string, data: Partial<any>, tenantInfo: TenantInfo): Promise<WeeklySchedule> {
    const existing = await schedulesRepository.findById(id, tenantInfo);
    if (!existing) {
      throw new NotFoundError('Programação', id);
    }

    const updateData: any = {};
    if (data.titulo !== undefined) updateData.titulo = data.titulo;
    if (data.title !== undefined) updateData.titulo = data.title;
    if (data.dataInicio !== undefined) updateData.dataInicio = new Date(data.dataInicio);
    if (data.startDate !== undefined) updateData.dataInicio = new Date(data.startDate);
    if (data.weekStart !== undefined) updateData.dataInicio = new Date(data.weekStart);
    if (data.dataFim !== undefined) updateData.dataFim = new Date(data.dataFim);
    if (data.endDate !== undefined) updateData.dataFim = new Date(data.endDate);
    if (data.weekEnd !== undefined) updateData.dataFim = new Date(data.weekEnd);
    if (data.isActive !== undefined) updateData.isAtivo = data.isActive;
    if (data.isAtivo !== undefined) updateData.isAtivo = data.isAtivo;

    const programacao = await schedulesRepository.update(id, updateData);

    // Se days foi enviado, substituir dias
    if (data.days && Array.isArray(data.days)) {
      await schedulesRepository.deleteDias(id);
      for (const item of data.days) {
        const rows = parseScheduleDay(item);
        for (const row of rows) {
          if (row.date && row.activity) {
            await schedulesRepository.createDia({
              programacaoId: id,
              data: new Date(row.date),
              diaSemana: row.weekday || undefined,
              atividade: row.activity,
              horario: row.time || undefined,
              localizacao: row.location || undefined,
              observacoes: row.notes,
              exercicioId: row.exercicioId,
              cargaPercent: row.cargaPercent,
            });
          }
        }
      }
    }

    const dias = await schedulesRepository.findDias(id);
    return transformScheduleToFrontend(programacao as any, dias as any);
  },

  /**
   * Deletar programação
   */
  async delete(id: string, tenantInfo: TenantInfo): Promise<boolean> {
    const existing = await schedulesRepository.findById(id, tenantInfo);
    if (!existing) {
      throw new NotFoundError('Programação', id);
    }

    await schedulesRepository.delete(id);
    return true;
  },
};

