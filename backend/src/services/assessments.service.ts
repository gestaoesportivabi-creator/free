/**
 * Service para Avaliações Físicas
 */

import { TenantInfo } from '../utils/tenant.helper';
import type { TransactionClient } from '../utils/transactionWithTenant';
import { assessmentsRepository } from '../repositories/assessments.repository';
import { PhysicalAssessment } from '../types/frontend';
import { NotFoundError } from '../utils/errors';

// Transformar avaliação do banco para frontend
// Frontend tem campos adicionais: bodyFatPercent, actionPlan, skinfolds
function transformAssessmentToFrontend(av: any): PhysicalAssessment {
  // Calcular bodyFatPercent se não estiver disponível
  const bodyFatPercent = av.gorduraCorporal ? Number(av.gorduraCorporal) : undefined;
  
  return {
    id: av.id,
    playerId: av.jogadorId,
    date: av.data instanceof Date ? av.data.toISOString().split('T')[0] : av.data,
    weight: av.peso ? Number(av.peso) : undefined,
    height: av.altura ? Number(av.altura) : undefined,
    bodyFat: bodyFatPercent, // Usar gorduraCorporal como bodyFat
    bodyFatPercent: bodyFatPercent, // Campo adicional do frontend
    muscleMass: av.massaMuscular ? Number(av.massaMuscular) : undefined,
    vo2max: av.vo2max ? Number(av.vo2max) : undefined,
    flexibility: av.flexibilidade ? Number(av.flexibilidade) : undefined,
    speed: av.velocidade ? Number(av.velocidade) : undefined,
    strength: av.forca ? Number(av.forca) : undefined,
    agility: av.agilidade ? Number(av.agilidade) : undefined,
    // Campos de skinfolds do frontend (mapear do banco)
    chest: av.peitoral ? Number(av.peitoral) : undefined,
    axilla: av.axilar ? Number(av.axilar) : undefined,
    subscapular: av.subescapular ? Number(av.subescapular) : undefined,
    triceps: av.triceps ? Number(av.triceps) : undefined,
    abdominal: av.abdominal ? Number(av.abdominal) : undefined,
    suprailiac: av.suprailiaca ? Number(av.suprailiaca) : undefined,
    thigh: av.coxa ? Number(av.coxa) : undefined,
    // Campo actionPlan do frontend
    actionPlan: av.planoAcao || undefined,
  } as any; // Usar 'as any' porque PhysicalAssessment pode ter campos opcionais adicionais
}

export const assessmentsService = {
  /**
   * Buscar todas as avaliações do tenant
   */
  async getAll(tenantInfo: TenantInfo, tx?: TransactionClient): Promise<PhysicalAssessment[]> {
    const avaliacoes = await assessmentsRepository.findAll(tenantInfo, tx);
    return avaliacoes.map(transformAssessmentToFrontend);
  },

  async getById(id: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<PhysicalAssessment> {
    const avaliacao = await assessmentsRepository.findById(id, tenantInfo, tx);
    if (!avaliacao) throw new NotFoundError('Avaliação física', id);
    return transformAssessmentToFrontend(avaliacao);
  },

  async create(data: any, _tenantInfo: TenantInfo, tx?: TransactionClient): Promise<PhysicalAssessment> {
    // Mapear campos do frontend para banco
    const backendData = {
      jogadorId: data.playerId,
      data: new Date(data.date),
      peso: data.weight,
      altura: data.height,
      gorduraCorporal: data.bodyFat || data.bodyFatPercent, // Frontend pode enviar bodyFatPercent
      massaMuscular: data.muscleMass,
      vo2max: data.vo2max,
      flexibilidade: data.flexibility,
      velocidade: data.speed,
      forca: data.strength,
      agilidade: data.agility,
      // Campos de skinfolds
      peitoral: data.chest,
      axilar: data.axilla,
      subescapular: data.subscapular,
      triceps: data.triceps,
      abdominal: data.abdominal,
      suprailiaca: data.suprailiac,
      coxa: data.thigh,
      // Campo actionPlan
      planoAcao: data.actionPlan,
    };

    const avaliacao = await assessmentsRepository.create(backendData, tx);
    return transformAssessmentToFrontend(avaliacao);
  },

  async update(id: string, data: Partial<any>, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<PhysicalAssessment> {
    const existing = await assessmentsRepository.findById(id, tenantInfo, tx);
    if (!existing) throw new NotFoundError('Avaliação física', id);

    // Mapear campos do frontend para banco
    const backendData: any = {};
    if (data.weight !== undefined) backendData.peso = data.weight;
    if (data.height !== undefined) backendData.altura = data.height;
    if (data.bodyFat !== undefined || data.bodyFatPercent !== undefined) {
      backendData.gorduraCorporal = data.bodyFat || data.bodyFatPercent;
    }
    if (data.muscleMass !== undefined) backendData.massaMuscular = data.muscleMass;
    if (data.vo2max !== undefined) backendData.vo2max = data.vo2max;
    if (data.flexibility !== undefined) backendData.flexibilidade = data.flexibility;
    if (data.speed !== undefined) backendData.velocidade = data.speed;
    if (data.strength !== undefined) backendData.forca = data.strength;
    if (data.agility !== undefined) backendData.agilidade = data.agility;
    // Campos de skinfolds
    if (data.chest !== undefined) backendData.peitoral = data.chest;
    if (data.axilla !== undefined) backendData.axilar = data.axilla;
    if (data.subscapular !== undefined) backendData.subescapular = data.subscapular;
    if (data.triceps !== undefined) backendData.triceps = data.triceps;
    if (data.abdominal !== undefined) backendData.abdominal = data.abdominal;
    if (data.suprailiac !== undefined) backendData.suprailiaca = data.suprailiac;
    if (data.thigh !== undefined) backendData.coxa = data.thigh;
    // Campo actionPlan
    if (data.actionPlan !== undefined) backendData.planoAcao = data.actionPlan;

    const avaliacao = await assessmentsRepository.update(id, backendData, tx);
    return transformAssessmentToFrontend(avaliacao);
  },

  async delete(id: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<boolean> {
    const existing = await assessmentsRepository.findById(id, tenantInfo, tx);
    if (!existing) throw new NotFoundError('Avaliação física', id);
    await assessmentsRepository.delete(id, tx);
    return true;
  },
};

