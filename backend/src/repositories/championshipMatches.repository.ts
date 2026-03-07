/**
 * Repository para Jogos de Campeonato
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';

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
  async findAll(tenantInfo: TenantInfo): Promise<CampeonatoJogoDB[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    
    if (equipeIds.length === 0) {
      return [];
    }

    // Buscar campeonatos do tenant
    const campeonatos = await prisma.campeonato.findMany({
      where: {
        equipeId: { in: equipeIds },
      },
      select: { id: true },
    });

    const campeonatoIds = campeonatos.map(c => c.id);

    return prisma.campeonatosJogos.findMany({
      where: {
        campeonatoId: { in: campeonatoIds },
      },
      orderBy: { data: 'asc' },
    }) as Promise<CampeonatoJogoDB[]>;
  },

  /**
   * Buscar por ID
   */
  async findById(id: string, tenantInfo: TenantInfo): Promise<CampeonatoJogoDB | null> {
    const equipeIds = tenantInfo.equipe_ids || [];
    
    if (equipeIds.length === 0) {
      return null;
    }

    const jogo = await prisma.campeonatosJogos.findUnique({
      where: { id },
      include: {
        campeonato: true,
      },
    });

    if (!jogo || !jogo.campeonato.equipeId || !equipeIds.includes(jogo.campeonato.equipeId)) {
      return null;
    }

    return jogo as CampeonatoJogoDB;
  },

  /**
   * Criar jogo de campeonato
   */
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
  }): Promise<CampeonatoJogoDB> {
    return prisma.campeonatosJogos.create({
      data,
    }) as Promise<CampeonatoJogoDB>;
  },

  /**
   * Atualizar jogo de campeonato
   */
  async update(id: string, data: Partial<CampeonatoJogoDB>): Promise<CampeonatoJogoDB> {
    return prisma.campeonatosJogos.update({
      where: { id },
      data,
    }) as Promise<CampeonatoJogoDB>;
  },

  /**
   * Deletar jogo de campeonato
   */
  async delete(id: string): Promise<boolean> {
    await prisma.campeonatosJogos.delete({
      where: { id },
    });
    return true;
  },
};

