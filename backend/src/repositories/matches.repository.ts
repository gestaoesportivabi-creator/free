/**
 * Repository para Jogos/Matches
 * Apenas acesso a dados - sem lógica de negócio
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';

// Tipos do banco
type JogoDB = {
  id: string;
  equipeId: string;
  adversario: string;
  data: Date;
  campeonato: string | null;
  competicaoId: string | null;
  local: string | null;
  resultado: string | null;
  golsPro: number;
  golsContra: number;
  videoUrl: string | null;
  createdAt: Date;
};

type JogoEstatisticaEquipeDB = {
  id: string;
  jogoId: string;
  minutosJogados: number;
  gols: number;
  golsSofridos: number;
  assistencias: number;
  cartoesAmarelos: number;
  cartoesVermelhos: number;
  passesCorretos: number;
  passesErrados: number;
  passesErradosTransicao: number;
  desarmesComBola: number;
  desarmesContraAtaque: number;
  desarmesSemBola: number;
  chutesNoGol: number;
  chutesFora: number;
  rpePartida: number | null;
  golsMarcadosJogoAberto: number;
  golsMarcadosBolaParada: number;
  golsSofridosJogoAberto: number;
  golsSofridosBolaParada: number;
};

type JogoEstatisticaJogadorDB = {
  id: string;
  jogoId: string;
  jogadorId: string;
  minutosJogados: number;
  gols: number;
  golsSofridos: number;
  assistencias: number;
  cartoesAmarelos: number;
  cartoesVermelhos: number;
  passesCorretos: number;
  passesErrados: number;
  passesErradosTransicao: number;
  desarmesComBola: number;
  desarmesContraAtaque: number;
  desarmesSemBola: number;
  chutesNoGol: number;
  chutesFora: number;
  rpePartida: number | null;
  golsMarcadosJogoAberto: number;
  golsMarcadosBolaParada: number;
  golsSofridosJogoAberto: number;
  golsSofridosBolaParada: number;
};

export const matchesRepository = {
  /**
   * Buscar todos os jogos do tenant
   */
  async findAll(tenantInfo: TenantInfo): Promise<JogoDB[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    
    if (equipeIds.length === 0) {
      return [];
    }

    return prisma.jogo.findMany({
      where: {
        equipeId: { in: equipeIds },
      },
      orderBy: { data: 'desc' },
    }) as Promise<JogoDB[]>;
  },

  /**
   * Buscar jogo por ID (com validação de tenant)
   */
  async findById(id: string, tenantInfo: TenantInfo): Promise<JogoDB | null> {
    const equipeIds = tenantInfo.equipe_ids || [];
    
    if (equipeIds.length === 0) {
      return null;
    }

    const jogo = await prisma.jogo.findUnique({
      where: { id },
    });

    if (!jogo || !equipeIds.includes(jogo.equipeId)) {
      return null;
    }

    return jogo as JogoDB;
  },

  /**
   * Buscar estatísticas da equipe para um jogo
   */
  async findEstatisticasEquipe(jogoId: string): Promise<JogoEstatisticaEquipeDB | null> {
    return prisma.jogosEstatisticasEquipe.findUnique({
      where: { jogoId },
    }) as Promise<JogoEstatisticaEquipeDB | null>;
  },

  /**
   * Buscar estatísticas dos jogadores para um jogo
   */
  async findEstatisticasJogadores(jogoId: string): Promise<JogoEstatisticaJogadorDB[]> {
    return prisma.jogosEstatisticasJogador.findMany({
      where: { jogoId },
    }) as Promise<JogoEstatisticaJogadorDB[]>;
  },

  /**
   * Criar novo jogo
   */
  async create(data: {
    equipeId: string;
    adversario: string;
    data: Date;
    campeonato?: string;
    competicaoId?: string;
    local?: string;
    resultado?: string;
    golsPro?: number;
    golsContra?: number;
    videoUrl?: string;
    postMatchEventLog?: object;
    playerRelationships?: object;
    lineup?: object;
    substitutionHistory?: object;
  }): Promise<JogoDB> {
    return prisma.jogo.create({
      data: {
        equipeId: data.equipeId,
        adversario: data.adversario,
        data: data.data,
        campeonato: data.campeonato,
        competicaoId: data.competicaoId,
        local: data.local,
        resultado: data.resultado as any,
        golsPro: data.golsPro || 0,
        golsContra: data.golsContra || 0,
        videoUrl: data.videoUrl,
        postMatchEventLog: data.postMatchEventLog as any,
        playerRelationships: data.playerRelationships as any,
        lineup: data.lineup as any,
        substitutionHistory: data.substitutionHistory as any,
      },
    }) as Promise<JogoDB>;
  },

  /**
   * Atualizar jogo
   */
  async update(id: string, data: Partial<JogoDB>): Promise<JogoDB> {
    return prisma.jogo.update({
      where: { id },
      data,
    }) as Promise<JogoDB>;
  },

  /**
   * Deletar jogo
   */
  async delete(id: string): Promise<boolean> {
    await prisma.jogo.delete({
      where: { id },
    });
    return true;
  },

  /**
   * Criar/atualizar estatísticas da equipe
   */
  async upsertEstatisticasEquipe(
    jogoId: string,
    data: Partial<JogoEstatisticaEquipeDB>
  ): Promise<JogoEstatisticaEquipeDB> {
    return prisma.jogosEstatisticasEquipe.upsert({
      where: { jogoId },
      update: data,
      create: {
        jogoId,
        ...data,
      } as any,
    }) as Promise<JogoEstatisticaEquipeDB>;
  },

  /**
   * Criar/atualizar estatísticas de jogador
   */
  async upsertEstatisticasJogador(
    jogoId: string,
    jogadorId: string,
    data: Partial<JogoEstatisticaJogadorDB>
  ): Promise<JogoEstatisticaJogadorDB> {
    return prisma.jogosEstatisticasJogador.upsert({
      where: {
        jogoId_jogadorId: {
          jogoId,
          jogadorId,
        },
      },
      update: data,
      create: {
        jogoId,
        jogadorId,
        ...data,
      } as any,
    }) as Promise<JogoEstatisticaJogadorDB>;
  },
};

