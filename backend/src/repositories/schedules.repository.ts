/**
 * Repository para Programações
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';

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
  async findAll(tenantInfo: TenantInfo): Promise<ProgramacaoDB[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    
    if (equipeIds.length === 0) {
      return [];
    }

    return prisma.programacao.findMany({
      where: {
        equipeId: { in: equipeIds },
      },
      orderBy: { dataInicio: 'desc' },
    }) as Promise<ProgramacaoDB[]>;
  },

  /**
   * Buscar programação por ID
   */
  async findById(id: string, tenantInfo: TenantInfo): Promise<ProgramacaoDB | null> {
    const equipeIds = tenantInfo.equipe_ids || [];
    
    if (equipeIds.length === 0) {
      return null;
    }

    const programacao = await prisma.programacao.findUnique({
      where: { id },
    });

    if (!programacao || !equipeIds.includes(programacao.equipeId)) {
      return null;
    }

    return programacao as ProgramacaoDB;
  },

  /**
   * Buscar dias de uma programação
   */
  async findDias(programacaoId: string): Promise<ProgramacaoDiaDB[]> {
    return prisma.programacoesDias.findMany({
      where: { programacaoId },
      orderBy: { data: 'asc' },
    }) as Promise<ProgramacaoDiaDB[]>;
  },

  /**
   * Criar programação
   */
  async create(data: {
    equipeId: string;
    titulo: string;
    dataInicio: Date;
    dataFim: Date;
    isAtivo?: boolean;
  }): Promise<ProgramacaoDB> {
    return prisma.programacao.create({
      data,
    }) as Promise<ProgramacaoDB>;
  },

  /**
   * Atualizar programação
   */
  async update(id: string, data: Partial<ProgramacaoDB>): Promise<ProgramacaoDB> {
    return prisma.programacao.update({
      where: { id },
      data,
    }) as Promise<ProgramacaoDB>;
  },

  /**
   * Deletar programação
   */
  async delete(id: string): Promise<boolean> {
    await prisma.programacao.delete({
      where: { id },
    });
    return true;
  },

  /**
   * Criar dia de programação
   */
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
  }): Promise<ProgramacaoDiaDB> {
    const { exercicioId, cargaPercent, ...rest } = data;
    return prisma.programacoesDias.create({
      data: {
        ...rest,
        ...(exercicioId && { exercicioId }),
        ...(cargaPercent != null && cargaPercent > 0 && { cargaPercent }),
      },
    }) as Promise<ProgramacaoDiaDB>;
  },

  /**
   * Deletar dias de uma programação
   */
  async deleteDias(programacaoId: string): Promise<boolean> {
    await prisma.programacoesDias.deleteMany({
      where: { programacaoId },
    });
    return true;
  },
};

