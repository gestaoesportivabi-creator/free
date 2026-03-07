/**
 * Repository para Controle de Tempo Jogado
 * Usa tabela jogos_eventos para armazenar entradas/saídas
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';

type JogoEventoDB = {
  id: string;
  jogoId: string;
  jogadorId: string;
  tipoEvento: 'ENTRADA' | 'SAIDA';
  minuto: number;
  segundo: number;
  createdAt: Date;
};

export const timeControlsRepository = {
  /**
   * Buscar eventos de um jogo
   */
  async findByJogoId(jogoId: string, tenantInfo: TenantInfo): Promise<JogoEventoDB[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    
    if (equipeIds.length === 0) {
      return [];
    }

    // Verificar se jogo pertence ao tenant
    const jogo = await prisma.jogo.findUnique({
      where: { id: jogoId },
    });

    if (!jogo || !equipeIds.includes(jogo.equipeId)) {
      return [];
    }

    return prisma.jogosEventos.findMany({
      where: { jogoId },
      orderBy: [
        { minuto: 'asc' },
        { segundo: 'asc' },
      ],
    }) as Promise<JogoEventoDB[]>;
  },

  /**
   * Buscar eventos por jogador em um jogo
   */
  async findByJogadorAndJogo(jogoId: string, jogadorId: string, tenantInfo: TenantInfo): Promise<JogoEventoDB[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    
    if (equipeIds.length === 0) {
      return [];
    }

    // Verificar se jogo pertence ao tenant
    const jogo = await prisma.jogo.findUnique({
      where: { id: jogoId },
    });

    if (!jogo || !equipeIds.includes(jogo.equipeId)) {
      return [];
    }

    return prisma.jogosEventos.findMany({
      where: {
        jogoId,
        jogadorId,
      },
      orderBy: [
        { minuto: 'asc' },
        { segundo: 'asc' },
      ],
    }) as Promise<JogoEventoDB[]>;
  },

  /**
   * Criar evento (entrada ou saída)
   */
  async createEvento(data: {
    jogoId: string;
    jogadorId: string;
    tipoEvento: 'ENTRADA' | 'SAIDA';
    minuto: number;
    segundo: number;
  }): Promise<JogoEventoDB> {
    return prisma.jogosEventos.create({
      data,
    }) as Promise<JogoEventoDB>;
  },

  /**
   * Deletar evento
   */
  async deleteEvento(id: string): Promise<boolean> {
    await prisma.jogosEventos.delete({
      where: { id },
    });
    return true;
  },

  /**
   * Deletar todos os eventos de um jogo
   */
  async deleteByJogoId(jogoId: string): Promise<boolean> {
    await prisma.jogosEventos.deleteMany({
      where: { jogoId },
    });
    return true;
  },
};

