/**
 * Repository para Jogos/Matches
 * Apenas acesso a dados - sem lógica de negócio
 */

import prisma from '../config/database';
import { TenantInfo } from '../utils/tenant.helper';
import type { TransactionClient } from '../utils/transactionWithTenant';

function db(tx?: TransactionClient) {
  return tx ?? prisma;
}

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
  async findAll(tenantInfo: TenantInfo, tx?: TransactionClient): Promise<JogoDB[]> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) return [];
    return db(tx).jogo.findMany({
      where: { equipeId: { in: equipeIds } },
      orderBy: { data: 'desc' },
    }) as Promise<JogoDB[]>;
  },

  async findById(id: string, tenantInfo: TenantInfo, tx?: TransactionClient): Promise<JogoDB | null> {
    const equipeIds = tenantInfo.equipe_ids || [];
    if (equipeIds.length === 0) return null;
    const jogo = await db(tx).jogo.findUnique({ where: { id } });
    if (!jogo || !equipeIds.includes(jogo.equipeId)) return null;
    return jogo as JogoDB;
  },

  async findEstatisticasEquipe(jogoId: string, tx?: TransactionClient): Promise<JogoEstatisticaEquipeDB | null> {
    return db(tx).jogosEstatisticasEquipe.findUnique({ where: { jogoId } }) as Promise<JogoEstatisticaEquipeDB | null>;
  },

  /** Busca estatísticas de equipe para vários jogos de uma vez (evita N+1) */
  async findEstatisticasEquipeByJogoIds(jogoIds: string[], tx?: TransactionClient): Promise<JogoEstatisticaEquipeDB[]> {
    if (jogoIds.length === 0) return [];
    return db(tx).jogosEstatisticasEquipe.findMany({
      where: { jogoId: { in: jogoIds } },
    }) as Promise<JogoEstatisticaEquipeDB[]>;
  },

  async findEstatisticasJogadores(jogoId: string, tx?: TransactionClient): Promise<JogoEstatisticaJogadorDB[]> {
    return db(tx).jogosEstatisticasJogador.findMany({ where: { jogoId } }) as Promise<JogoEstatisticaJogadorDB[]>;
  },

  /** Busca estatísticas de jogadores para vários jogos de uma vez (evita N+1) */
  async findEstatisticasJogadoresByJogoIds(jogoIds: string[], tx?: TransactionClient): Promise<JogoEstatisticaJogadorDB[]> {
    if (jogoIds.length === 0) return [];
    return db(tx).jogosEstatisticasJogador.findMany({
      where: { jogoId: { in: jogoIds } },
    }) as Promise<JogoEstatisticaJogadorDB[]>;
  },

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
  }, tx?: TransactionClient): Promise<JogoDB> {
    return db(tx).jogo.create({
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

  async update(id: string, data: Partial<JogoDB>, tx?: TransactionClient): Promise<JogoDB> {
    return db(tx).jogo.update({ where: { id }, data }) as Promise<JogoDB>;
  },

  async delete(id: string, tx?: TransactionClient): Promise<boolean> {
    await db(tx).jogo.delete({ where: { id } });
    return true;
  },

  async upsertEstatisticasEquipe(
    jogoId: string,
    data: Partial<JogoEstatisticaEquipeDB>,
    tx?: TransactionClient
  ): Promise<JogoEstatisticaEquipeDB> {
    return db(tx).jogosEstatisticasEquipe.upsert({
      where: { jogoId },
      update: data,
      create: { jogoId, ...data } as any,
    }) as Promise<JogoEstatisticaEquipeDB>;
  },

  async upsertEstatisticasJogador(
    jogoId: string,
    jogadorId: string,
    data: Partial<JogoEstatisticaJogadorDB>,
    tx?: TransactionClient
  ): Promise<JogoEstatisticaJogadorDB> {
    return db(tx).jogosEstatisticasJogador.upsert({
      where: { jogoId_jogadorId: { jogoId, jogadorId } },
      update: data,
      create: { jogoId, jogadorId, ...data } as any,
    }) as Promise<JogoEstatisticaJogadorDB>;
  },

  async setStatus(jogoId: string, status: string, tx?: TransactionClient): Promise<void> {
    await db(tx).$executeRawUnsafe(
      'UPDATE jogos SET status = $1 WHERE id = $2',
      status,
      jogoId
    );
  },

  async getStatusByIds(jogoIds: string[]): Promise<Map<string, string>> {
    if (jogoIds.length === 0) return new Map();
    const rows = await prisma.$queryRawUnsafe<{ id: string; status: string }[]>(
      `SELECT id, status FROM jogos WHERE id = ANY($1::text[])`,
      jogoIds
    );
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.status) map.set(r.id, r.status);
    }
    return map;
  },

  async setMetodoGol(jogoId: string, metodoGol: string, tx?: TransactionClient): Promise<void> {
    await db(tx).$executeRawUnsafe(
      `UPDATE jogos_estatisticas_equipe SET metodo_gol = $1 WHERE jogo_id = $2`,
      metodoGol,
      jogoId
    );
  },

  async getMetodoGolByJogoIds(jogoIds: string[]): Promise<Map<string, string>> {
    if (jogoIds.length === 0) return new Map();
    const rows = await prisma.$queryRawUnsafe<{ jogo_id: string; metodo_gol: string }[]>(
      `SELECT jogo_id, metodo_gol FROM jogos_estatisticas_equipe WHERE jogo_id = ANY($1::text[])`,
      jogoIds
    );
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.metodo_gol) map.set(r.jogo_id, r.metodo_gol);
    }
    return map;
  },

  async setMetodoGolTomado(jogoId: string, metodoGolTomado: string, tx?: TransactionClient): Promise<void> {
    await db(tx).$executeRawUnsafe(
      `UPDATE jogos_estatisticas_equipe SET metodo_gol_tomado = $1 WHERE jogo_id = $2`,
      metodoGolTomado,
      jogoId
    );
  },

  async getMetodoGolTomadoByJogoIds(jogoIds: string[]): Promise<Map<string, string>> {
    if (jogoIds.length === 0) return new Map();
    const rows = await prisma.$queryRawUnsafe<{ jogo_id: string; metodo_gol_tomado: string }[]>(
      `SELECT jogo_id, metodo_gol_tomado FROM jogos_estatisticas_equipe WHERE jogo_id = ANY($1::text[])`,
      jogoIds
    );
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.metodo_gol_tomado) map.set(r.jogo_id, r.metodo_gol_tomado);
    }
    return map;
  },
};

