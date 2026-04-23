import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import prisma from '../config/database';

type WellnessType = 'pse-treino' | 'pse-jogo' | 'psr-treino' | 'psr-jogo' | 'qualidade-sono' | 'bem-estar-diario';

const getModelInfo = (type: WellnessType) => {
  switch (type) {
    case 'pse-treino': return { model: prisma.pseTreino, idField: 'equipeId' as const, dateField: 'data' as const };
    case 'pse-jogo': return { model: prisma.pseJogo, idField: 'jogoId' as const, dateField: undefined };
    case 'psr-treino': return { model: prisma.psrTreino, idField: 'equipeId' as const, dateField: 'data' as const };
    case 'psr-jogo': return { model: prisma.psrJogo, idField: 'jogoId' as const, dateField: undefined };
    case 'qualidade-sono': return { model: prisma.qualidadeSono, idField: 'equipeId' as const, dateField: 'data' as const };
    default: throw new Error('Tipo inválido');
  }
};

function tenantEquipeIds(req: Request): string[] {
  return req.tenantInfo?.equipe_ids ?? [];
}

function isAdminUser(req: Request): boolean {
  return req.user?.role_id === 'ADMINISTRADOR';
}

async function getBemEstarDiario(req: Request, res: Response): Promise<void> {
  const equipeIds = tenantEquipeIds(req);
  const admin = isAdminUser(req);
  if (!admin && equipeIds.length === 0) {
    res.json({ success: true, data: [] });
    return;
  }
  const where = admin && equipeIds.length === 0 ? {} : { equipe_id: { in: equipeIds } };
  const data = await prisma.bem_estar_diario.findMany({
    where,
    orderBy: { created_at: 'desc' },
  });
  res.json({ success: true, data });
}

async function saveBemEstarDiarioBulk(req: Request, res: Response): Promise<void> {
  const { items } = req.body as { items?: Array<Record<string, unknown>> };
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, error: 'Lista de dados inválida.' });
    return;
  }
  const equipeIds = tenantEquipeIds(req);
  const admin = isAdminUser(req);
  const results: unknown[] = [];
  for (const item of items) {
    const equipeId = item.equipeId;
    const jogadorId = item.jogadorId;
    const data = item.data;
    if (
      typeof equipeId !== 'string' ||
      typeof jogadorId !== 'string' ||
      (!admin && (equipeIds.length === 0 || !equipeIds.includes(equipeId))) ||
      (typeof data !== 'string' && typeof data !== 'number')
    ) {
      continue;
    }
    const day = new Date(data as string);
    const existing = await prisma.bem_estar_diario.findFirst({
      where: { equipe_id: equipeId, jogador_id: jogadorId, data: day },
      select: { id: true },
    });
    const updateData = {
      nivel_stress: typeof item.stress === 'number' ? item.stress : null,
      qual_sono: typeof item.sono === 'number' ? item.sono : null,
      humor_mot: typeof item.humor === 'number' ? item.humor : null,
      dor_muscular: typeof item.dor === 'number' ? item.dor : null,
      satisfacao: typeof item.satisfacao === 'number' ? item.satisfacao : null,
      observacoes: typeof item.observacoes === 'string' ? item.observacoes : null,
      updated_at: new Date(),
    };
    if (existing) {
      const updated = await prisma.bem_estar_diario.update({
        where: { id: existing.id },
        data: updateData,
      });
      results.push(updated);
    } else {
      const created = await prisma.bem_estar_diario.create({
        data: {
          id: randomUUID(),
          equipe_id: equipeId,
          jogador_id: jogadorId,
          data: day,
          created_at: new Date(),
          ...updateData,
        },
      });
      results.push(created);
    }
  }
  res.status(200).json({ success: true, data: results });
}

export const wellnessController = {
  async getAll(req: Request, res: Response) {
    try {
      const { type } = req.params as { type: WellnessType };
      if (type === 'bem-estar-diario') {
        await getBemEstarDiario(req, res);
        return;
      }
      const { model, dateField } = getModelInfo(type);

      const equipeIds = tenantEquipeIds(req);
      const admin = isAdminUser(req);

      if (!admin && equipeIds.length === 0) {
        res.json({ success: true, data: [] });
        return;
      }

      let data: unknown[];
      if (admin && equipeIds.length === 0) {
        data = await (model as any).findMany({ orderBy: { createdAt: 'desc' } });
      } else if (dateField !== undefined) {
        data = await (model as any).findMany({
          where: { equipeId: { in: equipeIds } },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        data = await (model as any).findMany({
          where: { jogo: { equipeId: { in: equipeIds } } },
          orderBy: { createdAt: 'desc' },
        });
      }

      res.json({ success: true, data });
    } catch (error: unknown) {
      console.error(`Erro ao buscar dados de ${req.params.type}:`, error);
      res.status(500).json({ success: false, error: 'Erro ao buscar dados.' });
    }
  },

  async saveBulk(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params as { type: WellnessType };
      if (type === 'bem-estar-diario') {
        await saveBemEstarDiarioBulk(req, res);
        return;
      }
      const { items } = req.body;
      const { model, idField, dateField } = getModelInfo(type);

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, error: 'Lista de dados inválida.' });
        return;
      }

      const equipeIds = tenantEquipeIds(req);
      const admin = isAdminUser(req);

      const results: unknown[] = [];
      for (const item of items) {
        const { jogadorId, value, observacoes, data, jogoId, equipeId } = item as Record<string, unknown>;

        const fkId = idField === 'jogoId' ? jogoId : equipeId;
        if (!fkId || typeof fkId !== 'string' || !jogadorId || typeof jogadorId !== 'string' || value === undefined) continue;

        if (!admin) {
          if (equipeIds.length === 0) continue;
          if (idField === 'jogoId') {
            const jogo = await prisma.jogo.findUnique({
              where: { id: fkId as string },
              select: { equipeId: true },
            });
            if (!jogo || !equipeIds.includes(jogo.equipeId)) continue;
          } else {
            if (!equipeIds.includes(fkId as string)) continue;
          }
        }

        let existingRecord = null;

        if (dateField === 'data') {
          if (typeof data !== 'string' && typeof data !== 'number') continue;
          existingRecord = await (model as any).findFirst({
            where: {
              jogadorId,
              [idField]: fkId,
              [dateField]: new Date(data as string),
            },
          });
        } else {
          existingRecord = await (model as any).findFirst({
            where: {
              jogadorId,
              [idField]: fkId,
            },
          });
        }

        if (existingRecord) {
          const updated = await (model as any).update({
            where: { id: existingRecord.id },
            data: { valor: value, observacoes },
          });
          results.push(updated);
        } else {
          const dataToCreate: Record<string, unknown> = {
            jogadorId,
            [idField]: fkId,
            valor: value,
            observacoes,
          };
          if (dateField === 'data') {
            if (typeof data !== 'string' && typeof data !== 'number') continue;
            dataToCreate[dateField] = new Date(data as string);
          }

          const created = await (model as any).create({ data: dataToCreate });
          results.push(created);
        }
      }

      res.status(200).json({ success: true, data: results });
    } catch (error: unknown) {
      console.error(`Erro ao salvar dados de ${req.params.type}:`, error);
      res.status(500).json({ success: false, error: 'Erro ao salvar os dados.' });
    }
  },
};
