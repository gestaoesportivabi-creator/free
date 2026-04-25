/**
 * Repository para Lesões
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';
import type { TransactionClient } from '../utils/transactionWithTenant';

function db(tx?: TransactionClient) {
  return tx ?? prisma;
}

type LesaoDB = {
  id: string;
  jogadorId: string;
  data: Date;
  dataInicio: Date;
  dataFim: Date | null;
  tipo: string;
  localizacao: string;
  lado: string | null;
  severidade: string | null;
  origem: string | null;
  diasAfastado: number | null;
  createdAt: Date;
};

export const lesoesRepository = {
  /**
   * Buscar lesões por jogadores (do tenant)
   */
  async findByJogadores(jogadorIds: string[], tenantInfo: TenantInfo, tx?: TransactionClient): Promise<LesaoDB[]> {
    if (jogadorIds.length === 0) return [];
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) return [];

    const jogadoresValidos = await db(tx).jogador.findMany({
      where: {
        id: { in: jogadorIds },
        equipes: { some: { equipeId: { in: equipeIds } } },
      },
      select: { id: true },
    });
    const idsValidos = jogadoresValidos.map(j => j.id);
    return db(tx).lesao.findMany({
      where: { jogadorId: { in: idsValidos } },
      orderBy: { dataInicio: 'desc' },
    }) as Promise<LesaoDB[]>;
  },

  async findByJogador(jogadorId: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<LesaoDB[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) return [];

    const jogador = await db(tx).jogador.findFirst({
      where: {
        id: jogadorId,
        equipes: { some: { equipeId: { in: equipeIds } } },
      },
    });
    if (!jogador) return [];
    return db(tx).lesao.findMany({
      where: { jogadorId },
      orderBy: { dataInicio: 'desc' },
    }) as Promise<LesaoDB[]>;
  },

  async create(data: {
    jogadorId: string;
    data: Date;
    dataInicio: Date;
    dataFim?: Date | null;
    tipo: string;
    localizacao: string;
    lado?: string | null;
    severidade?: string | null;
    origem?: string | null;
    diasAfastado?: number | null;
  }, tx?: TransactionClient): Promise<LesaoDB> {
    return db(tx).lesao.create({
      data: {
        jogadorId: data.jogadorId,
        data: data.data,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim ?? null,
        tipo: data.tipo,
        localizacao: data.localizacao,
        lado: data.lado ?? null,
        severidade: data.severidade ?? null,
        origem: data.origem ?? null,
        diasAfastado: data.diasAfastado ?? null,
      },
    }) as Promise<LesaoDB>;
  },
};

