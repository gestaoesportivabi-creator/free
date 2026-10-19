import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import prisma from '../config/database';
import { bemEstarDiarioRepository, BemEstarDiarioRepository } from '../repositories/bemEstarDiario.repository';
import {
  PreparedBemEstar,
  StaffWellnessType,
  assertBemEstarRowInScope,
  assertStaffWellnessType,
  bemEstarListWhere,
  parseBemEstarDate,
  parseWellnessScore,
  prepareBemEstarItem,
  resolveTeamScope,
  wellnessFailure,
} from '../services/staffWellness.service';
import { NotFoundError, ValidationError } from '../utils/errors';
import { equipeInTenant, jogadorIdsInTenant, type JogadorTenantDb } from '../utils/tenantPlayers';

type ClassicWellnessType = Exclude<StaffWellnessType, 'bem-estar-diario'>;

const getModelInfo = (type: ClassicWellnessType) => {
  switch (type) {
    case 'pse-treino': return { model: prisma.pseTreino, idField: 'equipeId' as const, dateField: 'data' as const };
    case 'pse-jogo': return { model: prisma.pseJogo, idField: 'jogoId' as const, dateField: undefined };
    case 'psr-treino': return { model: prisma.psrTreino, idField: 'equipeId' as const, dateField: 'data' as const };
    case 'psr-jogo': return { model: prisma.psrJogo, idField: 'jogoId' as const, dateField: undefined };
    case 'qualidade-sono': return { model: prisma.qualidadeSono, idField: 'equipeId' as const, dateField: 'data' as const };
    default: throw new ValidationError('Tipo de wellness inválido.');
  }
};

function tenantEquipeIds(req: Request): string[] {
  return req.tenantInfo?.equipe_ids ?? [];
}

export type ClassicIo = {
  findMany(args: unknown): Promise<unknown[]>;
  findFirst(args: unknown): Promise<{ id: string } | null>;
  update(args: unknown): Promise<unknown>;
  create(args: unknown): Promise<unknown>;
  jogoEquipeId(jogoId: string): Promise<string | null>;
};

/** `players` e `classic` existem para o teste não abrir o Prisma. A rota não passa. */
export type WellnessAccess = {
  players?: JogadorTenantDb;
  classic?: ClassicIo;
};

function playersDb(access?: WellnessAccess): JogadorTenantDb {
  return access?.players ?? prisma;
}

function classicIo(type: ClassicWellnessType, access?: WellnessAccess): ClassicIo {
  if (access?.classic) return access.classic;
  const { model } = getModelInfo(type);
  const gateway = model as {
    findMany(args: unknown): Promise<unknown[]>;
    findFirst(args: unknown): Promise<{ id: string } | null>;
    update(args: unknown): Promise<unknown>;
    create(args: unknown): Promise<unknown>;
  };
  return {
    findMany: (args) => gateway.findMany(args),
    findFirst: (args) => gateway.findFirst(args),
    update: (args) => gateway.update(args),
    create: (args) => gateway.create(args),
    async jogoEquipeId(jogoId) {
      const jogo = await prisma.jogo.findUnique({
        where: { id: jogoId },
        select: { equipeId: true },
      });
      return jogo?.equipeId ?? null;
    },
  };
}

function jogadorField(row: unknown, field: 'jogador_id' | 'jogadorId'): string | undefined {
  if (!row || typeof row !== 'object') return undefined;
  const value = (row as Record<string, unknown>)[field];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

async function filterRowsInTenant<T>(
  rows: T[],
  equipeIds: string[],
  field: 'jogador_id' | 'jogadorId',
  db: JogadorTenantDb
): Promise<T[]> {
  const ids = rows.flatMap((row) => {
    const id = jogadorField(row, field);
    return id ? [id] : [];
  });
  if (ids.length === 0) return rows;
  const allowed = await jogadorIdsInTenant(ids, equipeIds, db);
  return rows.filter((row) => {
    const id = jogadorField(row, field);
    return id === undefined || allowed.has(id);
  });
}

/** Admin sem equipes (PR #12) continua sem filtro. Staff: equipe fora da lista é 404. */
function assertPayloadEquipes(items: unknown[], scope: ReturnType<typeof resolveTeamScope>): void {
  if (scope.mode === 'unrestricted') return;
  for (const raw of items) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const equipeId = (raw as Record<string, unknown>).equipeId;
    if (typeof equipeId !== 'string' || equipeId.length === 0) continue;
    if (!equipeInTenant(equipeId, scope.mode === 'restricted' ? scope.equipeIds : [])) {
      throw new NotFoundError('Equipe');
    }
  }
}

function isAdminUser(req: Request): boolean {
  return req.user?.role_id === 'ADMINISTRADOR';
}

function respondError(res: Response, error: unknown, fallback: string): void {
  const failure = wellnessFailure(error, fallback);
  if (failure.status >= 500) console.error(fallback, error);
  if (res.headersSent) return;
  res.status(failure.status).json({ success: false, error: failure.error });
}

async function listBemEstar(
  req: Request,
  res: Response,
  repo: BemEstarDiarioRepository,
  access?: WellnessAccess
): Promise<void> {
  const scope = resolveTeamScope(isAdminUser(req), tenantEquipeIds(req));
  if (scope.mode === 'none') {
    res.json({ success: true, data: [] });
    return;
  }

  let data = await repo.findMany({
    where: bemEstarListWhere(scope),
    orderBy: { created_at: 'desc' },
  });
  if (scope.mode === 'restricted') {
    data = await filterRowsInTenant(data, scope.equipeIds, 'jogador_id', playersDb(access));
  }
  res.json({ success: true, data });
}

async function saveBemEstar(
  req: Request,
  res: Response,
  repo: BemEstarDiarioRepository,
  access?: WellnessAccess
): Promise<void> {
  const items = (req.body as { items?: unknown } | undefined)?.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('Lista de dados inválida.');
  }

  const admin = isAdminUser(req);
  const scope = resolveTeamScope(admin, tenantEquipeIds(req));
  assertPayloadEquipes(items, scope);
  const prepared = items
    .map((item) => prepareBemEstarItem(item, scope))
    .filter((item): item is PreparedBemEstar => item !== null);

  if (scope.mode === 'restricted' && prepared.length > 0) {
    const allowed = await jogadorIdsInTenant(
      prepared.map((item) => item.jogadorId),
      scope.equipeIds,
      playersDb(access)
    );
    if (prepared.some((item) => !allowed.has(item.jogadorId))) {
      throw new NotFoundError('Jogador');
    }
  }

  const results: unknown[] = [];
  for (const item of prepared) {
    const existing = await repo.findFirst({
      where: { jogador_id: item.jogadorId, data: item.data },
    });

    if (existing) {
      assertBemEstarRowInScope(existing.equipe_id, admin, scope);
      const updated = await repo.update({
        where: { id: existing.id },
        data: {
          ...item.payload,
          equipe_id: item.equipeId,
          updated_at: new Date(),
        },
      });
      results.push(updated);
    } else {
      const created = await repo.create({
        data: {
          id: randomUUID(),
          equipe_id: item.equipeId,
          jogador_id: item.jogadorId,
          data: item.data,
          ...item.payload,
        },
      });
      results.push(created);
    }
  }

  res.status(200).json({ success: true, data: results });
}

export async function getAll(
  req: Request,
  res: Response,
  repo: BemEstarDiarioRepository = bemEstarDiarioRepository,
  access?: WellnessAccess
): Promise<void> {
  try {
    const type = assertStaffWellnessType(req.params.type);
    if (type === 'bem-estar-diario') {
      await listBemEstar(req, res, repo, access);
      return;
    }

    const { dateField } = getModelInfo(type);
    const io = classicIo(type, access);
    const scope = resolveTeamScope(isAdminUser(req), tenantEquipeIds(req));
    if (scope.mode === 'none') {
      res.json({ success: true, data: [] });
      return;
    }

    const teamWhere = bemEstarListWhere(scope);
    let data: unknown[];
    if (!teamWhere) {
      data = await io.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } else if (dateField !== undefined) {
      data = await io.findMany({
        where: { equipeId: teamWhere.equipe_id },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      data = await io.findMany({
        where: { jogo: { equipeId: teamWhere.equipe_id } },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (scope.mode === 'restricted') {
      data = await filterRowsInTenant(data, scope.equipeIds, 'jogadorId', playersDb(access));
    }

    res.json({ success: true, data });
  } catch (error: unknown) {
    respondError(res, error, 'Erro ao buscar dados.');
  }
}

export async function saveBulk(
  req: Request,
  res: Response,
  repo: BemEstarDiarioRepository = bemEstarDiarioRepository,
  access?: WellnessAccess
): Promise<void> {
  try {
    const type = assertStaffWellnessType(req.params.type);
    if (type === 'bem-estar-diario') {
      await saveBemEstar(req, res, repo, access);
      return;
    }

    const items = (req.body as { items?: unknown } | undefined)?.items;
    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('Lista de dados inválida.');
    }

    const { idField, dateField } = getModelInfo(type);
    const io = classicIo(type, access);
    const admin = isAdminUser(req);
    const scope = resolveTeamScope(admin, tenantEquipeIds(req));

    type Prepared = {
      jogadorId: string;
      fkId: string;
      valor: number;
      observacoes: unknown;
      data?: Date;
    };
    const prepared: Prepared[] = [];

    for (const raw of items) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new ValidationError('Item de wellness inválido.');
      }
      const item = raw as Record<string, unknown>;
      const jogadorId = item.jogadorId;
      const fkId = idField === 'jogoId' ? item.jogoId : item.equipeId;
      if (typeof fkId !== 'string' || !fkId || typeof jogadorId !== 'string' || !jogadorId) continue;
      if (item.value === undefined || item.value === null || item.value === '') continue;

      const valor = parseWellnessScore(item.value);
      if (valor === null) continue;

      if (!admin) {
        if (scope.mode === 'none') throw new NotFoundError('Equipe');
        if (idField !== 'jogoId' && scope.mode === 'restricted' && !equipeInTenant(fkId, scope.equipeIds)) {
          throw new NotFoundError('Equipe');
        }
      }

      let data: Date | undefined;
      if (dateField === 'data') {
        if (item.data === undefined || item.data === null || item.data === '') continue;
        data = parseBemEstarDate(item.data);
      }

      prepared.push({
        jogadorId,
        fkId,
        valor,
        observacoes: item.observacoes,
        data,
      });
    }

    if (!admin && scope.mode === 'restricted' && prepared.length > 0) {
      if (idField === 'jogoId') {
        for (const item of prepared) {
          const equipeId = await io.jogoEquipeId(item.fkId);
          if (!equipeInTenant(equipeId, scope.equipeIds)) throw new NotFoundError('Jogo');
        }
      }
      const allowed = await jogadorIdsInTenant(
        prepared.map((item) => item.jogadorId),
        scope.equipeIds,
        playersDb(access)
      );
      if (prepared.some((item) => !allowed.has(item.jogadorId))) {
        throw new NotFoundError('Jogador');
      }
    }

    const results: unknown[] = [];
    for (const item of prepared) {
      const where: Record<string, unknown> = {
        jogadorId: item.jogadorId,
        [idField]: item.fkId,
      };
      if (dateField === 'data') where.data = item.data;

      const existingRecord = await io.findFirst({ where });

      if (existingRecord) {
        const updated = await io.update({
          where: { id: existingRecord.id },
          data: { valor: item.valor, observacoes: item.observacoes },
        });
        results.push(updated);
      } else {
        const dataToCreate: Record<string, unknown> = {
          jogadorId: item.jogadorId,
          [idField]: item.fkId,
          valor: item.valor,
          observacoes: item.observacoes,
        };
        if (dateField === 'data') dataToCreate.data = item.data;
        results.push(await io.create({ data: dataToCreate }));
      }
    }

    res.status(200).json({ success: true, data: results });
  } catch (error: unknown) {
    respondError(res, error, 'Erro ao salvar os dados.');
  }
}

export const wellnessController = {
  getAll,
  saveBulk,
};
