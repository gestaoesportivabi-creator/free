/**
 * Repository para Lesões
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';

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
  async findByJogadores(jogadorIds: string[], tenantInfo: TenantInfo): Promise<LesaoDB[]> {
    if (jogadorIds.length === 0) {
      return [];
    }

    // Validar que jogadores pertencem ao tenant
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) {
      return [];
    }

    const jogadoresValidos = await prisma.jogador.findMany({
      where: {
        id: { in: jogadorIds },
        equipes: {
          some: {
            equipeId: { in: equipeIds },
          },
        },
      },
      select: { id: true },
    });

    const idsValidos = jogadoresValidos.map(j => j.id);

    return prisma.lesao.findMany({
      where: {
        jogadorId: { in: idsValidos },
      },
      orderBy: { dataInicio: 'desc' },
    }) as Promise<LesaoDB[]>;
  },

  /**
   * Buscar lesões por jogador
   */
  async findByJogador(jogadorId: string, tenantInfo: TenantInfo): Promise<LesaoDB[]> {
    // Validar que jogador pertence ao tenant
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) {
      return [];
    }

    const jogador = await prisma.jogador.findFirst({
      where: {
        id: jogadorId,
        equipes: {
          some: {
            equipeId: { in: equipeIds },
          },
        },
      },
    });

    if (!jogador) {
      return [];
    }

    return prisma.lesao.findMany({
      where: { jogadorId },
      orderBy: { dataInicio: 'desc' },
    }) as Promise<LesaoDB[]>;
  },

  /**
   * Criar lesão
   */
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
  }): Promise<LesaoDB> {
    return prisma.lesao.create({
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

