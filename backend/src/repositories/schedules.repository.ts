/**
 * Repository para Programações
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';
import type { TransactionClient } from '../utils/transactionWithTenant';

function db(tx?: TransactionClient) {
  return tx ?? prisma;
}

type ProgramacaoDB = {
  id: string;
  equipeId: string;
  titulo: string;
  dataInicio: Date;
  dataFim: Date;
  isAtivo: boolean;
  createdAt: Date;
};

type ProgramacaoDiaDB = {
  id: string;
  programacaoId: string;
  data: Date;
  diaSemana: string | null;
  diaSemanaNumero: number | null;
  atividade: string | null;
  horario: string | null;
  localizacao: string | null;
  observacoes: string | null;
  exercicioId: string | null;
  cargaPercent: number | null;
  createdAt: Date;
};

export const schedulesRepository = {
  /**
   * Buscar todas as programações do tenant
   */
  async findAll(tenantInfo: TenantInfo, tx?: TransactionClient): Promise<ProgramacaoDB[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) return [];
    return db(tx).programacao.findMany({
      where: { equipeId: { in: equipeIds } },
      orderBy: { dataInicio: 'desc' },
    }) as Promise<ProgramacaoDB[]>;
  },

  async findById(id: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<ProgramacaoDB | null> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) return null;
    const programacao = await db(tx).programacao.findUnique({ where: { id } });
    if (!programacao || !equipeIds.includes(programacao.equipeId)) return null;
    return programacao as ProgramacaoDB;
  },

  async findDias(programacaoId: string, tx?: TransactionClient): Promise<ProgramacaoDiaDB[]> {
    return db(tx).programacoesDias.findMany({
      where: { programacaoId },
      orderBy: { data: 'asc' },
    }) as Promise<ProgramacaoDiaDB[]>;
  },

  async create(data: {
    equipeId: string;
    titulo: string;
    dataInicio: Date;
    dataFim: Date;
    isAtivo?: boolean;
  }, tx?: TransactionClient): Promise<ProgramacaoDB> {
    return db(tx).programacao.create({ data }) as Promise<ProgramacaoDB>;
  },

  async update(id: string, data: Partial<ProgramacaoDB>, tx?: TransactionClient): Promise<ProgramacaoDB> {
    return db(tx).programacao.update({ where: { id }, data }) as Promise<ProgramacaoDB>;
  },

  async delete(id: string, tx?: TransactionClient): Promise<boolean> {
    await db(tx).programacao.delete({ where: { id } });
    return true;
  },

  async createDia(data: {
    programacaoId: string;
    data: Date;
    diaSemana?: string;
    diaSemanaNumero?: number;
    atividade?: string;
    horario?: string;
    localizacao?: string;
    observacoes?: string;
    exercicioId?: string;
    cargaPercent?: number;
  }, tx?: TransactionClient): Promise<ProgramacaoDiaDB> {
    const { exercicioId, cargaPercent, ...rest } = data;
    return db(tx).programacoesDias.create({
      data: {
        ...rest,
        ...(exercicioId && { exercicioId }),
        ...(cargaPercent != null && cargaPercent > 0 && { cargaPercent }),
      },
    }) as Promise<ProgramacaoDiaDB>;
  },

  async deleteDias(programacaoId: string, tx?: TransactionClient): Promise<boolean> {
    await db(tx).programacoesDias.deleteMany({ where: { programacaoId } });
    return true;
  },
};

