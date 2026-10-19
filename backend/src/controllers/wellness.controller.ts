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
import { ValidationError } from '../utils/errors';

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

function isAdminUser(req: Request): boolean {
  return req.user?.role_id === 'ADMINISTRADOR';
}

function respondError(res: Response, error: unknown, fallback: string): void {
  const failure = wellnessFailure(error, fallback);
  if (failure.status >= 500) console.error(fallback, error);
  if (res.headersSent) return;
  res.status(failure.status).json({ success: false, error: failure.error });
}

async function listBemEstar(req: Request, res: Response, repo: BemEstarDiarioRepository): Promise<void> {
  const scope = resolveTeamScope(isAdminUser(req), tenantEquipeIds(req));
  if (scope.mode === 'none') {
    res.json({ success: true, data: [] });
    return;
  }

  const data = await repo.findMany({
    where: bemEstarListWhere(scope),
    orderBy: { created_at: 'desc' },
  });
  res.json({ success: true, data });
}

async function saveBemEstar(req: Request, res: Response, repo: BemEstarDiarioRepository): Promise<void> {
  const items = (req.body as { items?: unknown } | undefined)?.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('Lista de dados inválida.');
  }

  const admin = isAdminUser(req);
  const scope = resolveTeamScope(admin, tenantEquipeIds(req));
  const prepared = items
    .map((item) => prepareBemEstarItem(item, scope))
    .filter((item): item is PreparedBemEstar => item !== null);

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
  repo: BemEstarDiarioRepository = bemEstarDiarioRepository
): Promise<void> {
  try {
    const type = assertStaffWellnessType(req.params.type);
    if (type === 'bem-estar-diario') {
      await listBemEstar(req, res, repo);
      return;
    }

    const { model, dateField } = getModelInfo(type);
    const scope = resolveTeamScope(isAdminUser(req), tenantEquipeIds(req));
    if (scope.mode === 'none') {
      res.json({ success: true, data: [] });
      return;
    }

    const teamWhere = bemEstarListWhere(scope);
    let data: unknown[];
    if (!teamWhere) {
      data = await (model as { findMany: (args: unknown) => Promise<unknown[]> }).findMany({
        orderBy: { createdAt: 'desc' },
      });
    } else if (dateField !== undefined) {
      data = await (model as { findMany: (args: unknown) => Promise<unknown[]> }).findMany({
        where: { equipeId: teamWhere.equipe_id },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      data = await (model as { findMany: (args: unknown) => Promise<unknown[]> }).findMany({
        where: { jogo: { equipeId: teamWhere.equipe_id } },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json({ success: true, data });
  } catch (error: unknown) {
    respondError(res, error, 'Erro ao buscar dados.');
  }
}

export async function saveBulk(
  req: Request,
  res: Response,
  repo: BemEstarDiarioRepository = bemEstarDiarioRepository
): Promise<void> {
  try {
    const type = assertStaffWellnessType(req.params.type);
    if (type === 'bem-estar-diario') {
      await saveBemEstar(req, res, repo);
      return;
    }

    const items = (req.body as { items?: unknown } | undefined)?.items;
    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('Lista de dados inválida.');
    }

    const { model, idField, dateField } = getModelInfo(type);
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
        if (scope.mode === 'none') continue;
        if (idField !== 'jogoId' && scope.mode === 'restricted' && !scope.equipeIds.includes(fkId)) continue;
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

    const results: unknown[] = [];
    for (const item of prepared) {
      if (!admin && idField === 'jogoId') {
        if (scope.mode !== 'restricted') continue;
        const jogo = await prisma.jogo.findUnique({
          where: { id: item.fkId },
          select: { equipeId: true },
        });
        if (!jogo || !scope.equipeIds.includes(jogo.equipeId)) continue;
      }

      const where: Record<string, unknown> = {
        jogadorId: item.jogadorId,
        [idField]: item.fkId,
      };
      if (dateField === 'data') where.data = item.data;

      const existingRecord = await (model as { findFirst: (args: unknown) => Promise<{ id: string } | null> }).findFirst({
        where,
      });

      if (existingRecord) {
        const updated = await (model as { update: (args: unknown) => Promise<unknown> }).update({
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
        const created = await (model as { create: (args: unknown) => Promise<unknown> }).create({
          data: dataToCreate,
        });
        results.push(created);
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
