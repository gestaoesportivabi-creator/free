/**
 * Campeonatos sempre filtrados pelas equipes do tenant (técnico ou clube).
 * Recurso de outra equipe responde 404, inclusive no create com equipeId alheio.
 */

import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import type { TenantInfo } from '../utils/tenant.helper';

export type ChampionshipRow = {
  id: string;
  nome: string;
  equipeId: string | null;
  createdAt: Date;
  dados: unknown;
};

export type ChampionshipStore = {
  listByEquipes(equipeIds: string[]): Promise<ChampionshipRow[]>;
  create(data: { nome: string; equipeId: string; dados: unknown }): Promise<ChampionshipRow>;
  updateInEquipes(
    id: string,
    equipeIds: string[],
    data: { nome?: string; dados: unknown }
  ): Promise<ChampionshipRow | null>;
  deleteInEquipes(id: string, equipeIds: string[]): Promise<boolean>;
};

export type ChampionshipResult = {
  status: number;
  body: { success: boolean; data?: unknown; error?: string };
};

const NOT_FOUND: ChampionshipResult = {
  status: 404,
  body: { success: false, error: 'Campeonato não encontrado' },
};

export function tenantEquipeIds(tenantInfo: TenantInfo | undefined): string[] {
  const raw = tenantInfo?.equipe_ids;
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

function present(row: ChampionshipRow) {
  return {
    id: row.id,
    name: row.nome,
    equipeId: row.equipeId,
    createdAt: row.createdAt?.toISOString(),
    ...((row.dados as object) || {}),
  };
}

function nomeFrom(body: Record<string, unknown>, fallback: string | undefined): string | undefined {
  const name = body.name || body.nome;
  if (typeof name === 'string' && name) return name;
  return fallback;
}

/** equipeId omitido usa a primeira equipe do tenant. Valor fora da lista é 404. */
export function resolveCreateEquipeId(
  body: Record<string, unknown>,
  equipeIds: readonly string[]
): string | null {
  const raw = body.equipeId;
  if (raw === undefined || raw === null || raw === '') return equipeIds[0] ?? null;
  if (typeof raw !== 'string' || !equipeIds.includes(raw)) return null;
  return raw;
}

export const prismaChampionshipStore: ChampionshipStore = {
  async listByEquipes(equipeIds) {
    if (equipeIds.length === 0) return [];
    return prisma.campeonato.findMany({
      where: { equipeId: { in: equipeIds } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data) {
    return prisma.campeonato.create({
      data: {
        nome: data.nome,
        equipeId: data.equipeId,
        dados: data.dados as Prisma.InputJsonValue,
      },
    });
  },

  async updateInEquipes(id, equipeIds, data) {
    if (equipeIds.length === 0) return null;
    const updated = await prisma.campeonato.updateMany({
      where: { id, equipeId: { in: equipeIds } },
      data: {
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        dados: data.dados as Prisma.InputJsonValue,
      },
    });
    if (updated.count === 0) return null;
    return prisma.campeonato.findFirst({ where: { id, equipeId: { in: equipeIds } } });
  },

  async deleteInEquipes(id, equipeIds) {
    if (equipeIds.length === 0) return false;
    const removed = await prisma.campeonato.deleteMany({
      where: { id, equipeId: { in: equipeIds } },
    });
    return removed.count > 0;
  },
};

function dadosFrom(body: Record<string, unknown>): Record<string, unknown> {
  const { name: _name, id: _id, equipeId: _equipeId, createdAt: _createdAt, ...dados } = body;
  return dados;
}

export async function listChampionships(
  store: ChampionshipStore,
  tenantInfo: TenantInfo | undefined
): Promise<ChampionshipResult> {
  const equipeIds = tenantEquipeIds(tenantInfo);
  if (equipeIds.length === 0) return { status: 200, body: { success: true, data: [] } };
  const rows = await store.listByEquipes(equipeIds);
  return { status: 200, body: { success: true, data: rows.map(present) } };
}

export async function createChampionship(
  store: ChampionshipStore,
  tenantInfo: TenantInfo | undefined,
  body: Record<string, unknown>
): Promise<ChampionshipResult> {
  const equipeIds = tenantEquipeIds(tenantInfo);
  if (equipeIds.length === 0) {
    return { status: 400, body: { success: false, error: 'Nenhuma equipe' } };
  }
  const equipeId = resolveCreateEquipeId(body, equipeIds);
  if (!equipeId) return NOT_FOUND;

  const row = await store.create({
    nome: nomeFrom(body, '') ?? '',
    equipeId,
    dados: dadosFrom(body),
  });
  return { status: 201, body: { success: true, data: present(row) } };
}

export async function updateChampionship(
  store: ChampionshipStore,
  tenantInfo: TenantInfo | undefined,
  id: string,
  body: Record<string, unknown>
): Promise<ChampionshipResult> {
  const equipeIds = tenantEquipeIds(tenantInfo);
  const rawEquipe = body.equipeId;
  if (rawEquipe !== undefined && rawEquipe !== null && rawEquipe !== '') {
    if (typeof rawEquipe !== 'string' || !equipeIds.includes(rawEquipe)) return NOT_FOUND;
  }

  const row = await store.updateInEquipes(id, equipeIds, {
    nome: nomeFrom(body, undefined),
    dados: dadosFrom(body),
  });
  if (!row) return NOT_FOUND;
  return { status: 200, body: { success: true, data: present(row) } };
}

export async function deleteChampionship(
  store: ChampionshipStore,
  tenantInfo: TenantInfo | undefined,
  id: string
): Promise<ChampionshipResult> {
  const removed = await store.deleteInEquipes(id, tenantEquipeIds(tenantInfo));
  if (!removed) return NOT_FOUND;
  return { status: 200, body: { success: true } };
}
