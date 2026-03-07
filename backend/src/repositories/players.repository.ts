/**
 * Repository para Jogadores
 * Apenas acesso a dados - sem lógica de negócio
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';

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

export const playersRepository = {
  /**
   * Buscar todos os jogadores do tenant
   */
  async findAll(tenantInfo: TenantInfo): Promise<JogadorDB[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    
    if (equipeIds.length === 0) {
      return [];
    }

    return prisma.jogador.findMany({
      where: {
        equipes: {
          some: {
            equipeId: { in: equipeIds },
            dataFim: null, // Apenas jogadores ativos na equipe
          },
        },
      },
      orderBy: { nome: 'asc' },
    }) as Promise<JogadorDB[]>;
  },

  /**
   * Buscar jogador por ID (com validação de tenant)
   */
  async findById(id: string, tenantInfo: TenantInfo): Promise<JogadorDB | null> {
    const equipeIds = tenantInfo.equipe_ids || [];
    
    if (equipeIds.length === 0) {
      return null;
    }

    const jogador = await prisma.jogador.findUnique({
      where: { id },
      include: {
        equipes: {
          where: {
            equipeId: { in: equipeIds },
          },
        },
      },
    });

    // Verificar se jogador pertence ao tenant
    if (!jogador || jogador.equipes.length === 0) {
      return null;
    }

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
  }): Promise<JogadorDB> {
    return prisma.jogador.create({
      data: data as any,
    }) as Promise<JogadorDB>;
  },

  /**
   * Atualizar jogador
   */
  async update(id: string, data: Partial<JogadorDB>): Promise<JogadorDB> {
    return prisma.jogador.update({
      where: { id },
      data: data as any,
    }) as Promise<JogadorDB>;
  },

  /**
   * Deletar jogador
   */
  async delete(id: string): Promise<boolean> {
    await prisma.jogador.delete({
      where: { id },
    });
    return true;
  },
};

