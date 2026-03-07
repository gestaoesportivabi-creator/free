/**
 * Service para Metas de Estatísticas
 */

import { TenantInfo } from '../utils/tenant.helper';
import { statTargetsRepository } from '../repositories/statTargets.repository';
import { StatTargets } from '../types/frontend';
import { transformStatTargetsToFrontend, transformStatTargetsToBackend } from '../adapters/statTargets.adapter';

export const statTargetsService = {
  /**
   * Buscar metas do tenant
   * Retorna array com um item para compatibilidade com frontend que chama getAll()
   */
  async getAll(tenantInfo: TenantInfo): Promise<StatTargets[]> {
    const meta = await statTargetsRepository.findByTenant(tenantInfo);
    const targets = transformStatTargetsToFrontend(meta);
    return [targets]; // Retornar array para compatibilidade
  },

  /**
   * Buscar metas do tenant (objeto único)
   */
  async get(tenantInfo: TenantInfo): Promise<StatTargets> {
    const meta = await statTargetsRepository.findByTenant(tenantInfo);
    return transformStatTargetsToFrontend(meta);
  },

  /**
   * Atualizar metas
   * Não precisa de ID - usa tenant para identificar
   */
  async update(data: Partial<StatTargets>, tenantInfo: TenantInfo): Promise<StatTargets> {
    // Usar primeira equipe do tenant
    const equipeId = tenantInfo.equipe_ids?.[0];
    if (!equipeId) {
      throw new Error('Nenhuma equipe encontrada para o tenant');
    }

    // Transformar dados do frontend para formato do banco
    const backendData = transformStatTargetsToBackend(data);

    const meta = await statTargetsRepository.upsert(equipeId, backendData as any);
    return transformStatTargetsToFrontend(meta);
  },
};

