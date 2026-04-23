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
  dataRetornoPrevisto: Date | null;
  tipo: string;
  localizacao: string;
  lado: string | null;
  severidade: string | null;
  origem: string | null;
  diasAfastado: number | null;
  createdAt: Date;
};

const LESAO_BASE_SELECT = {
  id: true,
  jogadorId: true,
  data: true,
  dataInicio: true,
  dataFim: true,
  tipo: true,
  localizacao: true,
  lado: true,
  severidade: true,
  origem: true,
  diasAfastado: true,
  createdAt: true,
} as const;

const LESAO_SELECT_WITH_PREDICTED = {
  ...LESAO_BASE_SELECT,
  dataRetornoPrevisto: true,
} as const;

function isMissingPredictedReturnColumnError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error || '');
  return msg.includes('data_retorno_previsto') || msg.includes('dataRetornoPrevisto');
}

function withPredictedNullWhenMissing(
  rows: Array<Omit<LesaoDB, 'dataRetornoPrevisto'> & { dataRetornoPrevisto?: Date | null }>
): LesaoDB[] {
  return rows.map((row) => ({
    ...row,
    dataRetornoPrevisto: row.dataRetornoPrevisto ?? null,
  }));
}

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
    try {
      const rows = await db(tx).lesao.findMany({
        where: { jogadorId: { in: idsValidos } },
        orderBy: { dataInicio: 'desc' },
        select: LESAO_SELECT_WITH_PREDICTED,
      });
      return rows as LesaoDB[];
    } catch (error) {
      if (!isMissingPredictedReturnColumnError(error)) throw error;
      const rows = await db(tx).lesao.findMany({
        where: { jogadorId: { in: idsValidos } },
        orderBy: { dataInicio: 'desc' },
        select: LESAO_BASE_SELECT,
      });
      return withPredictedNullWhenMissing(rows as Array<Omit<LesaoDB, 'dataRetornoPrevisto'>>);
    }
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
    try {
      const rows = await db(tx).lesao.findMany({
        where: { jogadorId },
        orderBy: { dataInicio: 'desc' },
        select: LESAO_SELECT_WITH_PREDICTED,
      });
      return rows as LesaoDB[];
    } catch (error) {
      if (!isMissingPredictedReturnColumnError(error)) throw error;
      const rows = await db(tx).lesao.findMany({
        where: { jogadorId },
        orderBy: { dataInicio: 'desc' },
        select: LESAO_BASE_SELECT,
      });
      return withPredictedNullWhenMissing(rows as Array<Omit<LesaoDB, 'dataRetornoPrevisto'>>);
    }
  },

  async create(data: {
    jogadorId: string;
    data: Date;
    dataInicio: Date;
    dataFim?: Date | null;
    dataRetornoPrevisto?: Date | null;
    tipo: string;
    localizacao: string;
    lado?: string | null;
    severidade?: string | null;
    origem?: string | null;
    diasAfastado?: number | null;
  }, tx?: TransactionClient): Promise<LesaoDB> {
    const baseData = {
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
    };
    const createData = data.dataRetornoPrevisto
      ? { ...baseData, dataRetornoPrevisto: data.dataRetornoPrevisto }
      : baseData;
    try {
      const created = await db(tx).lesao.create({
        data: createData as any,
        select: LESAO_SELECT_WITH_PREDICTED,
      });
      return created as LesaoDB;
    } catch (error) {
      if (!isMissingPredictedReturnColumnError(error)) throw error;
      const created = await db(tx).lesao.create({
        data: baseData,
        select: LESAO_BASE_SELECT,
      });
      const [normalized] = withPredictedNullWhenMissing([
        created as Omit<LesaoDB, 'dataRetornoPrevisto'>,
      ]);
      return normalized;
    }
  },
};

