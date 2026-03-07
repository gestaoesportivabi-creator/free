/**
 * Repository para Competições
 */

import prisma from '../config/database';

type CompeticaoDB = {
  id: string;
  nome: string;
  createdAt: Date;
};

export const competitionsRepository = {
  /**
   * Buscar todas as competições
   * Nota: Competições são globais, não filtradas por tenant
   */
  async findAll(): Promise<CompeticaoDB[]> {
    return prisma.competicao.findMany({
      orderBy: { nome: 'asc' },
    }) as Promise<CompeticaoDB[]>;
  },

  /**
   * Buscar competição por ID
   */
  async findById(id: string): Promise<CompeticaoDB | null> {
    return prisma.competicao.findUnique({
      where: { id },
    }) as Promise<CompeticaoDB | null>;
  },

  /**
   * Buscar competição por nome
   */
  async findByName(nome: string): Promise<CompeticaoDB | null> {
    return prisma.competicao.findUnique({
      where: { nome },
    }) as Promise<CompeticaoDB | null>;
  },

  /**
   * Criar competição
   */
  async create(data: { nome: string }): Promise<CompeticaoDB> {
    return prisma.competicao.create({
      data,
    }) as Promise<CompeticaoDB>;
  },
};

