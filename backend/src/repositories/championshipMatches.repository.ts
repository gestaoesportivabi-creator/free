/**
 * Repository para Jogos de Campeonato
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';
import type { TransactionClient } from '../utils/transactionWithTenant';

function db(tx?: TransactionClient) {
  return tx ?? prisma;
}

type CampeonatoJogoDB = {
  id: string;
  campeonatoId: string;
  data: Date;
  horario: string | null;
  equipe: string;
  adversario: string;
  competicao: string | null;
  local: string | null;
  metaPontuacao: string | null;
  jogoId: string | null;
  createdAt: Date;
};

export const championshipMatchesRepository = {
  /**
   * Buscar todos os jogos de campeonato do tenant
   */
  async findAll(tenantInfo: TenantInfo, tx?: TransactionClient): Promise<CampeonatoJogoDB[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) return [];

    const campeonatos = await db(tx).campeonato.findMany({
      where: { equipeId: { in: equipeIds } },
      select: { id: true },
    });
    const campeonatoIds = campeonatos.map(c => c.id);
    return db(tx).campeonatosJogos.findMany({
      where: { campeonatoId: { in: campeonatoIds } },
      orderBy: { data: 'asc' },
    }) as Promise<CampeonatoJogoDB[]>;
  },

  async findById(id: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<CampeonatoJogoDB | null> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) return null;

    const jogo = await db(tx).campeonatosJogos.findUnique({
      where: { id },
      include: { campeonato: true },
    });
    if (!jogo || !jogo.campeonato.equipeId || !equipeIds.includes(jogo.campeonato.equipeId)) return null;
    return jogo as CampeonatoJogoDB;
  },

  async create(data: {
    campeonatoId: string;
    data: Date;
    horario?: string;
    equipe: string;
    adversario: string;
    competicao?: string;
    local?: string;
    metaPontuacao?: string;
    jogoId?: string;
  }, tx?: TransactionClient): Promise<CampeonatoJogoDB> {
    return db(tx).campeonatosJogos.create({ data }) as Promise<CampeonatoJogoDB>;
  },

  async update(id: string, data: Partial<CampeonatoJogoDB>, tx?: TransactionClient): Promise<CampeonatoJogoDB> {
    return db(tx).campeonatosJogos.update({ where: { id }, data }) as Promise<CampeonatoJogoDB>;
  },

  async delete(id: string, tx?: TransactionClient): Promise<boolean> {
    await db(tx).campeonatosJogos.delete({ where: { id } });
    return true;
  },
};

