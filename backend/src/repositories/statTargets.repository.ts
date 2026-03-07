/**
 * Repository para Metas de Estatísticas
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';
import type { TransactionClient } from '../utils/transactionWithTenant';

function db(tx?: TransactionClient) {
  return tx ?? prisma;
}

type MetasEstatisticasDB = {
  id: string;
  equipeId: string | null;
  gols: number;
  assistencias: number;
  passesCorretos: number;
  passesErrados: number;
  chutesNoGol: number;
  chutesFora: number;
  desarmesComPosse: number;
  desarmesSemPosse: number;
  desarmesContraAtaque: number;
  errosTransicao: number;
  createdAt: Date;
  updatedAt: Date;
};

export const statTargetsRepository = {
  /**
   * Buscar metas do tenant (por equipe)
   */
  async findByTenant(tenantInfo: TenantInfo, tx?: TransactionClient): Promise<MetasEstatisticasDB | null> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) return null;
    return db(tx).metasEstatisticas.findFirst({
      where: { equipeId: { in: equipeIds } },
    }) as Promise<MetasEstatisticasDB | null>;
  },

  async findById(id: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<MetasEstatisticasDB | null> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) return null;
    const meta = await db(tx).metasEstatisticas.findUnique({ where: { id } });
    if (!meta || !meta.equipeId || !equipeIds.includes(meta.equipeId)) return null;
    return meta as MetasEstatisticasDB;
  },

  async upsert(equipeId: string, data: Partial<MetasEstatisticasDB>, tx?: TransactionClient): Promise<MetasEstatisticasDB> {
    const existing = await db(tx).metasEstatisticas.findFirst({ where: { equipeId } });
    if (existing) {
      return db(tx).metasEstatisticas.update({ where: { id: existing.id }, data }) as Promise<MetasEstatisticasDB>;
    }
    return db(tx).metasEstatisticas.create({ data: { equipeId, ...data } as any }) as Promise<MetasEstatisticasDB>;
  },
};

