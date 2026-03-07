/**
 * Repository para Avaliações Físicas
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';
import type { TransactionClient } from '../utils/transactionWithTenant';

function db(tx?: TransactionClient) {
  return tx ?? prisma;
}

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
  async findAll(tenantInfo: TenantInfo, tx?: TransactionClient): Promise<AvaliacaoFisicaDB[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) return [];

    const jogadores = await db(tx).jogador.findMany({
      where: { equipes: { some: { equipeId: { in: equipeIds } } } },
      select: { id: true },
    });
    const jogadorIds = jogadores.map(j => j.id);
    return db(tx).avaliacaoFisica.findMany({
      where: { jogadorId: { in: jogadorIds } },
      orderBy: { data: 'desc' },
    }) as Promise<AvaliacaoFisicaDB[]>;
  },

  async findById(id: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<AvaliacaoFisicaDB | null> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) return null;

    const avaliacao = await db(tx).avaliacaoFisica.findUnique({
      where: { id },
      include: {
        jogador: {
          include: {
            equipes: { where: { equipeId: { in: equipeIds } } },
          },
        },
      },
    });
    if (!avaliacao || avaliacao.jogador.equipes.length === 0) return null;
    return avaliacao as AvaliacaoFisicaDB;
  },

  async findByJogador(jogadorId: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<AvaliacaoFisicaDB[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) return [];

    const jogador = await db(tx).jogador.findFirst({
      where: {
        id: jogadorId,
        equipes: { some: { equipeId: { in: equipeIds } } },
      },
    });
    if (!jogador) return [];
    return db(tx).avaliacaoFisica.findMany({
      where: { jogadorId },
      orderBy: { data: 'desc' },
    }) as Promise<AvaliacaoFisicaDB[]>;
  },

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
  }, tx?: TransactionClient): Promise<AvaliacaoFisicaDB> {
    return db(tx).avaliacaoFisica.create({ data }) as Promise<AvaliacaoFisicaDB>;
  },

  async update(id: string, data: Partial<AvaliacaoFisicaDB>, tx?: TransactionClient): Promise<AvaliacaoFisicaDB> {
    return db(tx).avaliacaoFisica.update({ where: { id }, data }) as Promise<AvaliacaoFisicaDB>;
  },

  async delete(id: string, tx?: TransactionClient): Promise<boolean> {
    await db(tx).avaliacaoFisica.delete({ where: { id } });
    return true;
  },
};

