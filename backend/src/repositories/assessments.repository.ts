/**
 * Repository para Avaliações Físicas
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';

type AvaliacaoFisicaDB = {
  id: string;
  jogadorId: string;
  data: Date;
  peso: number | null;
  altura: number | null;
  gorduraCorporal: number | null;
  massaMuscular: number | null;
  vo2max: number | null;
  flexibilidade: number | null;
  velocidade: number | null;
  forca: number | null;
  agilidade: number | null;
  peitoral: number | null;
  axilar: number | null;
  subescapular: number | null;
  triceps: number | null;
  abdominal: number | null;
  suprailiaca: number | null;
  coxa: number | null;
  planoAcao: string | null;
  createdAt: Date;
};

export const assessmentsRepository = {
  /**
   * Buscar todas as avaliações do tenant
   */
  async findAll(tenantInfo: TenantInfo): Promise<AvaliacaoFisicaDB[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    
    if (equipeIds.length === 0) {
      return [];
    }

    // Buscar jogadores do tenant
    const jogadores = await prisma.jogador.findMany({
      where: {
        equipes: {
          some: {
            equipeId: { in: equipeIds },
          },
        },
      },
      select: { id: true },
    });

    const jogadorIds = jogadores.map(j => j.id);

    return prisma.avaliacaoFisica.findMany({
      where: {
        jogadorId: { in: jogadorIds },
      },
      orderBy: { data: 'desc' },
    }) as Promise<AvaliacaoFisicaDB[]>;
  },

  /**
   * Buscar avaliação por ID
   */
  async findById(id: string, tenantInfo: TenantInfo): Promise<AvaliacaoFisicaDB | null> {
    const equipeIds = tenantInfo.equipe_ids || [];
    
    if (equipeIds.length === 0) {
      return null;
    }

    const avaliacao = await prisma.avaliacaoFisica.findUnique({
      where: { id },
      include: {
        jogador: {
          include: {
            equipes: {
              where: {
                equipeId: { in: equipeIds },
              },
            },
          },
        },
      },
    });

    if (!avaliacao || avaliacao.jogador.equipes.length === 0) {
      return null;
    }

    return avaliacao as AvaliacaoFisicaDB;
  },

  /**
   * Buscar avaliações por jogador
   */
  async findByJogador(jogadorId: string, tenantInfo: TenantInfo): Promise<AvaliacaoFisicaDB[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    
    if (equipeIds.length === 0) {
      return [];
    }

    // Validar que jogador pertence ao tenant
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

    return prisma.avaliacaoFisica.findMany({
      where: { jogadorId },
      orderBy: { data: 'desc' },
    }) as Promise<AvaliacaoFisicaDB[]>;
  },

  /**
   * Criar avaliação
   */
  async create(data: {
    jogadorId: string;
    data: Date;
    peso?: number;
    altura?: number;
    gorduraCorporal?: number;
    massaMuscular?: number;
    vo2max?: number;
    flexibilidade?: number;
    velocidade?: number;
    forca?: number;
    agilidade?: number;
    peitoral?: number;
    axilar?: number;
    subescapular?: number;
    triceps?: number;
    abdominal?: number;
    suprailiaca?: number;
    coxa?: number;
    planoAcao?: string;
  }): Promise<AvaliacaoFisicaDB> {
    return prisma.avaliacaoFisica.create({
      data,
    }) as Promise<AvaliacaoFisicaDB>;
  },

  /**
   * Atualizar avaliação
   */
  async update(id: string, data: Partial<AvaliacaoFisicaDB>): Promise<AvaliacaoFisicaDB> {
    return prisma.avaliacaoFisica.update({
      where: { id },
      data,
    }) as Promise<AvaliacaoFisicaDB>;
  },

  /**
   * Deletar avaliação
   */
  async delete(id: string): Promise<boolean> {
    await prisma.avaliacaoFisica.delete({
      where: { id },
    });
    return true;
  },
};

