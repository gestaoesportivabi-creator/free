/**
 * Repository para Controle de Tempo Jogado
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';
import type { TransactionClient } from '../utils/transactionWithTenant';

function db(tx?: TransactionClient) {
  return tx ?? prisma;
}

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
  async findByJogoId(jogoId: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<JogoEventoDB[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) return [];
    const jogo = await db(tx).jogo.findUnique({ where: { id: jogoId } });
    if (!jogo || !equipeIds.includes(jogo.equipeId)) return [];
    return db(tx).jogosEventos.findMany({
      where: { jogoId },
      orderBy: [{ minuto: 'asc' }, { segundo: 'asc' }],
    }) as Promise<JogoEventoDB[]>;
  },

  async findByJogadorAndJogo(jogoId: string, jogadorId: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<JogoEventoDB[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) return [];
    const jogo = await db(tx).jogo.findUnique({ where: { id: jogoId } });
    if (!jogo || !equipeIds.includes(jogo.equipeId)) return [];
    return db(tx).jogosEventos.findMany({
      where: { jogoId, jogadorId },
      orderBy: [{ minuto: 'asc' }, { segundo: 'asc' }],
    }) as Promise<JogoEventoDB[]>;
  },

  async createEvento(data: {
    jogoId: string;
    jogadorId: string;
    tipoEvento: 'ENTRADA' | 'SAIDA';
    minuto: number;
    segundo: number;
  }, tx?: TransactionClient): Promise<JogoEventoDB> {
    return db(tx).jogosEventos.create({ data }) as Promise<JogoEventoDB>;
  },

  async deleteEvento(id: string, tx?: TransactionClient): Promise<boolean> {
    await db(tx).jogosEventos.delete({ where: { id } });
    return true;
  },

  async deleteByJogoId(jogoId: string, tx?: TransactionClient): Promise<boolean> {
    await db(tx).jogosEventos.deleteMany({ where: { jogoId } });
    return true;
  },
};

