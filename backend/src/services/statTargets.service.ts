/**
 * Service para Metas de Estatísticas
 */

import { TenantInfo } from '../utils/tenant.helper';
import type { TransactionClient } from '../utils/transactionWithTenant';
import { statTargetsRepository } from '../repositories/statTargets.repository';
import { StatTargets } from '../types/frontend';
import { transformStatTargetsToFrontend, transformStatTargetsToBackend } from '../adapters/statTargets.adapter';

export const statTargetsService = {
  async getAll(tenantInfo: TenantInfo, tx?: TransactionClient): Promise<StatTargets[]> {
    const meta = await statTargetsRepository.findByTenant(tenantInfo, tx);
    const targets = transformStatTargetsToFrontend(meta);
    return [targets];
  },

  async get(tenantInfo: TenantInfo, tx?: TransactionClient): Promise<StatTargets> {
    const meta = await statTargetsRepository.findByTenant(tenantInfo, tx);
    return transformStatTargetsToFrontend(meta);
  },

  async update(data: Partial<StatTargets>, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<StatTargets> {
    const equipeId = tenantInfo.equipe_ids?.[0];
    if (!equipeId) throw new Error('Nenhuma equipe encontrada para o tenant');
    const backendData = transformStatTargetsToBackend(data);
    const meta = await statTargetsRepository.upsert(equipeId, backendData as any, tx);
    return transformStatTargetsToFrontend(meta);
  },
};

