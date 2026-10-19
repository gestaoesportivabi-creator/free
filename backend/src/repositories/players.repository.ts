/**
 * Repository para Jogadores
 * Apenas acesso a dados - sem lógica de negócio
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';
import type { TransactionClient } from '../utils/transactionWithTenant';
import { activeJerseyLookup } from '../validators/jerseyNumber';

// Tipos do banco (Prisma gera automaticamente, mas definimos aqui para referência)
type JogadorDB = {
  id: string;
  nome: string;
  apelido: string | null;
  dataNascimento: Date | null;
  idade: number | null;
  funcaoEmQuadra: string | null;
  numeroCamisa: number | null;
  peDominante: string | null;
  altura: number | null;
  peso: number | null;
  ultimoClube: string | null;
  fotoUrl: string | null;
  maxLoadsJson?: unknown;
  isTransferido: boolean;
  dataTransferencia: Date | null;
  isAtivo: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function db(tx?: TransactionClient) {
  return tx ?? prisma;
}

export const playersRepository = {
  /**
   * Buscar todos os jogadores do tenant
   */
  async findAll(tenantInfo: TenantInfo, tx?: TransactionClient): Promise<JogadorDB[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) return [];

    return db(tx).jogador.findMany({
      where: {
        equipes: {
          some: {
            equipeId: { in: equipeIds },
            dataFim: null,
          },
        },
      },
      orderBy: { nome: 'asc' },
    }) as Promise<JogadorDB[]>;
  },

  /**
   * Buscar jogador por ID (com validação de tenant)
   */
  async findById(id: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<JogadorDB | null> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) return null;

    const jogador = await db(tx).jogador.findUnique({
      where: { id },
      include: {
        equipes: {
          where: { equipeId: { in: equipeIds } },
        },
      },
    });
    if (!jogador || jogador.equipes.length === 0) return null;
    return jogador as JogadorDB;
  },

  /**
   * Criar novo jogador
   */
  async create(data: {
    nome: string;
    apelido?: string;
    dataNascimento?: Date;
    idade?: number;
    funcaoEmQuadra?: string;
    numeroCamisa?: number;
    peDominante?: string;
    altura?: number;
    peso?: number;
    ultimoClube?: string;
    fotoUrl?: string;
    maxLoadsJson?: unknown;
    isTransferido?: boolean;
    dataTransferencia?: Date;
    isAtivo?: boolean;
  }, tx?: TransactionClient): Promise<JogadorDB> {
    return db(tx).jogador.create({ data: data as any }) as Promise<JogadorDB>;
  },

  /**
   * Atualizar jogador
   */
  async update(id: string, data: Partial<JogadorDB>, tx?: TransactionClient): Promise<JogadorDB> {
    return db(tx).jogador.update({ where: { id }, data: data as any }) as Promise<JogadorDB>;
  },

  /**
   * Equipes do tenant em que o jogador está ativo (vínculo sem data fim).
   */
  async findActiveEquipeIds(jogadorId: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<string[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) return [];
    const links = await db(tx).equipesJogadores.findMany({
      where: {
        jogadorId,
        equipeId: { in: equipeIds },
        dataFim: null,
      },
      select: { equipeId: true },
    });
    return links.map((link) => link.equipeId);
  },

  /**
   * Outro atleta ativo com a mesma camisa, só na equipe informada se ela for do tenant.
   * Equipe de fora do tenant não gera consulta.
   */
  async findActiveJerseyHolder(
    equipeId: string,
    numeroCamisa: number,
    tenantInfo: TenantInfo,
    excludePlayerId?: string,
    tx?: TransactionClient,
  ): Promise<{ id: string; nome: string } | null> {
    const lookup = activeJerseyLookup({
      equipeId,
      numeroCamisa,
      tenantEquipeIds: tenantInfo.equipe_ids || [],
      excludePlayerId,
    });
    if (lookup.refused) return null;

    const row = await db(tx).jogador.findFirst({
      where: lookup.where,
      select: { id: true, nome: true },
    });
    return row ? { id: row.id, nome: row.nome } : null;
  },

  /**
   * Deletar jogador
   */
  async delete(id: string, tx?: TransactionClient): Promise<boolean> {
    await db(tx).jogador.delete({ where: { id } });
    return true;
  },
};

