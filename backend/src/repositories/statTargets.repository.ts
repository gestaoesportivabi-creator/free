/**
 * Repository para Metas de Estatísticas
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';

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
  async findByTenant(tenantInfo: TenantInfo): Promise<MetasEstatisticasDB | null> {
    const equipeIds = tenantInfo.equipe_ids || [];
    
    if (equipeIds.length === 0) {
      return null;
    }

    // Buscar primeira meta encontrada (ou criar padrão)
    return prisma.metasEstatisticas.findFirst({
      where: {
        equipeId: { in: equipeIds },
      },
    }) as Promise<MetasEstatisticasDB | null>;
  },

  /**
   * Buscar por ID
   */
  async findById(id: string, tenantInfo: TenantInfo): Promise<MetasEstatisticasDB | null> {
    const equipeIds = tenantInfo.equipe_ids || [];
    
    if (equipeIds.length === 0) {
      return null;
    }

    const meta = await prisma.metasEstatisticas.findUnique({
      where: { id },
    });

    if (!meta || !meta.equipeId || !equipeIds.includes(meta.equipeId)) {
      return null;
    }

    return meta as MetasEstatisticasDB;
  },

  /**
   * Criar ou atualizar metas
   */
  async upsert(
    equipeId: string,
    data: Partial<MetasEstatisticasDB>
  ): Promise<MetasEstatisticasDB> {
    // Buscar meta existente
    const existing = await prisma.metasEstatisticas.findFirst({
      where: { equipeId },
    });

    if (existing) {
      return prisma.metasEstatisticas.update({
        where: { id: existing.id },
        data,
      }) as Promise<MetasEstatisticasDB>;
    }

    // Criar nova
    return prisma.metasEstatisticas.create({
      data: {
        equipeId,
        ...data,
      } as any,
    }) as Promise<MetasEstatisticasDB>;
  },
};

