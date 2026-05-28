/**
 * Controller /api/me — portal do atleta
 */

import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { ForbiddenError, ValidationError } from '../utils/errors';
import { validateAccessPassword } from '../utils/athleteAccount.helper';
import {
  getAthleteTodaySummary,
  todayDateString,
} from '../services/athleteWellness.service';

export type MeWellnessType =
  | 'pse-treino'
  | 'pse-jogo'
  | 'psr-treino'
  | 'psr-jogo'
  | 'bem-estar-diario';

function athleteContext(req: Request) {
  const jogadorId = req.user?.jogador_id ?? req.tenantInfo?.jogador_id;
  const equipeIds = req.tenantInfo?.equipe_ids ?? [];
  if (!jogadorId) throw new ForbiddenError('Conta de atleta inválida');
  return { jogadorId, equipeId: equipeIds[0] ?? null, equipeIds };
}

function parseDay(input: string | number | undefined): Date {
  if (typeof input === 'string' && input.length >= 10) {
    return new Date(input.slice(0, 10) + 'T12:00:00.000Z');
  }
  return new Date(todayDateString() + 'T12:00:00.000Z');
}

const getModelInfo = (type: MeWellnessType) => {
  switch (type) {
    case 'pse-treino':
      return { model: prisma.pseTreino, idField: 'equipeId' as const, dateField: 'data' as const };
    case 'pse-jogo':
      return { model: prisma.pseJogo, idField: 'jogoId' as const, dateField: undefined };
    case 'psr-treino':
      return { model: prisma.psrTreino, idField: 'equipeId' as const, dateField: 'data' as const };
    case 'psr-jogo':
      return { model: prisma.psrJogo, idField: 'jogoId' as const, dateField: undefined };
    default:
      throw new ValidationError('Tipo de wellness inválido');
  }
};

export const meController = {
  async getProfile(req: Request, res: Response) {
    try {
      const { jogadorId, equipeId } = athleteContext(req);
      const [jogador, user, equipe] = await Promise.all([
        prisma.jogador.findUnique({ where: { id: jogadorId } }),
        prisma.user.findUnique({
          where: { jogadorId },
          select: { email: true, name: true, isActive: true },
        }),
        equipeId
          ? prisma.equipe.findUnique({ where: { id: equipeId }, select: { nome: true, categoria: true } })
          : null,
      ]);
      if (!jogador) {
        return res.status(404).json({ success: false, error: 'Jogador não encontrado' });
      }
      return res.json({
        success: true,
        data: {
          id: jogador.id,
          name: jogador.nome,
          nickname: jogador.apelido,
          email: user?.email ?? null,
          photoUrl: jogador.fotoUrl,
          position: jogador.funcaoEmQuadra,
          jerseyNumber: jogador.numeroCamisa,
          equipeId,
          equipeName: equipe?.nome ?? null,
          equipeCategoria: equipe?.categoria ?? null,
          accessActive: user?.isActive ?? false,
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao buscar perfil';
      const status = error instanceof ForbiddenError ? 403 : 500;
      return res.status(status).json({ success: false, error: msg });
    }
  },

  async updateProfile(req: Request, res: Response) {
    try {
      const { jogadorId } = athleteContext(req);
      const { name, photoUrl, password } = req.body as {
        name?: string;
        photoUrl?: string;
        password?: string;
      };

      const user = await prisma.user.findUnique({ where: { jogadorId } });
      if (!user) {
        return res.status(404).json({ success: false, error: 'Conta de acesso não encontrada' });
      }

      const userUpdate: { name?: string; passwordHash?: string } = {};
      if (name?.trim()) userUpdate.name = name.trim();
      if (password) {
        validateAccessPassword(password);
        userUpdate.passwordHash = await bcrypt.hash(password, 10);
      }

      if (Object.keys(userUpdate).length > 0) {
        await prisma.user.update({ where: { id: user.id }, data: userUpdate });
      }

      if (photoUrl !== undefined) {
        await prisma.jogador.update({
          where: { id: jogadorId },
          data: { fotoUrl: photoUrl?.trim() || null },
        });
      }

      return res.json({ success: true, data: { ok: true } });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
      const status =
        error instanceof ValidationError ? 400 : error instanceof ForbiddenError ? 403 : 500;
      return res.status(status).json({ success: false, error: msg });
    }
  },

  async getScheduleContext(req: Request, res: Response) {
    try {
      const { equipeIds } = athleteContext(req);
      if (!equipeIds.length) {
        return res.json({ success: true, data: { schedule: null, recentMatches: [] } });
      }

      const [programacao, recentMatches] = await Promise.all([
        prisma.programacao.findFirst({
          where: { equipeId: { in: equipeIds }, isAtivo: true },
          include: { dias: { orderBy: { data: 'asc' } } },
          orderBy: { dataInicio: 'desc' },
        }),
        prisma.jogo.findMany({
          where: { equipeId: { in: equipeIds } },
          orderBy: { data: 'desc' },
          take: 10,
          select: {
            id: true,
            adversario: true,
            data: true,
            campeonato: true,
            resultado: true,
          },
        }),
      ]);

      return res.json({
        success: true,
        data: {
          schedule: programacao
            ? {
                id: programacao.id,
                title: programacao.titulo,
                weekStart: programacao.dataInicio,
                weekEnd: programacao.dataFim,
                days: programacao.dias.map((d) => ({
                  date: d.data.toISOString().slice(0, 10),
                  weekday: d.diaSemana,
                  time: d.horario,
                  activity: d.atividade,
                  location: d.localizacao,
                  notes: d.observacoes,
                })),
              }
            : null,
          recentMatches: recentMatches.map((m) => ({
            id: m.id,
            opponent: m.adversario,
            date: m.data.toISOString().slice(0, 10),
            competition: m.campeonato,
            result: m.resultado,
          })),
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao buscar agenda';
      return res.status(500).json({ success: false, error: msg });
    }
  },

  async getWellnessToday(req: Request, res: Response) {
    try {
      const { jogadorId } = athleteContext(req);
      const summary = await getAthleteTodaySummary(jogadorId);

      let recentMatchDate: string | null = null;
      if (summary.recentMatchId) {
        const m = await prisma.jogo.findUnique({
          where: { id: summary.recentMatchId },
          select: { data: true },
        });
        recentMatchDate = m?.data.toISOString().slice(0, 10) ?? null;
      }

      return res.json({
        success: true,
        data: { ...summary, recentMatchDate },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao buscar status do dia';
      return res.status(500).json({ success: false, error: msg });
    }
  },

  async getWellnessByType(req: Request, res: Response) {
    try {
      const { jogadorId, equipeIds } = athleteContext(req);
      const type = req.params.type as MeWellnessType;

      if (type === 'bem-estar-diario') {
        const data = await prisma.bem_estar_diario.findMany({
          where: {
            jogador_id: jogadorId,
            ...(equipeIds.length ? { equipe_id: { in: equipeIds } } : {}),
          },
          orderBy: { data: 'desc' },
          take: 90,
        });
        return res.json({ success: true, data });
      }

      const { model, idField, dateField } = getModelInfo(type);
      const where: Record<string, unknown> = { jogadorId };
      if (idField === 'equipeId' && equipeIds.length) {
        where.equipeId = { in: equipeIds };
      } else if (idField === 'jogoId' && equipeIds.length) {
        where.jogo = { equipeId: { in: equipeIds } };
      }

      const data = await (model as { findMany: (args: unknown) => Promise<unknown[]> }).findMany({
        where,
        orderBy: dateField ? { data: 'desc' } : { createdAt: 'desc' },
        take: 90,
      });

      return res.json({ success: true, data });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao buscar dados';
      return res.status(500).json({ success: false, error: msg });
    }
  },

  async saveWellnessByType(req: Request, res: Response) {
    try {
      const { jogadorId, equipeIds } = athleteContext(req);
      const type = req.params.type as MeWellnessType;
      const body = req.body as Record<string, unknown>;

      if (body.jogadorId && body.jogadorId !== jogadorId) {
        throw new ForbiddenError('Não é permitido registrar dados de outro atleta');
      }

      if (type === 'bem-estar-diario') {
        const equipeId = (body.equipeId as string) || equipeIds[0];
        if (!equipeId || !equipeIds.includes(equipeId)) {
          throw new ForbiddenError('Equipe inválida');
        }
        const day = parseDay(body.data as string);
        const existing = await prisma.bem_estar_diario.findFirst({
          where: { equipe_id: equipeId, jogador_id: jogadorId, data: day },
        });
        const updateData = {
          nivel_stress: typeof body.stress === 'number' ? body.stress : null,
          qual_sono: typeof body.sono === 'number' ? body.sono : null,
          humor_mot: typeof body.humor === 'number' ? body.humor : null,
          dor_muscular: typeof body.dor === 'number' ? body.dor : null,
          satisfacao: typeof body.satisfacao === 'number' ? body.satisfacao : null,
          observacoes: typeof body.observacoes === 'string' ? body.observacoes : null,
          updated_at: new Date(),
        };
        const saved = existing
          ? await prisma.bem_estar_diario.update({ where: { id: existing.id }, data: updateData })
          : await prisma.bem_estar_diario.create({
              data: {
                id: randomUUID(),
                equipe_id: equipeId,
                jogador_id: jogadorId,
                data: day,
                created_at: new Date(),
                ...updateData,
              },
            });
        return res.json({ success: true, data: saved });
      }

      const { model, idField, dateField } = getModelInfo(type);
      const value = body.value ?? body.valor;
      if (value === undefined || value === null) {
        throw new ValidationError('Valor é obrigatório');
      }

      const fkId =
        idField === 'jogoId'
          ? (body.jogoId as string)
          : ((body.equipeId as string) || equipeIds[0]);

      if (!fkId) throw new ValidationError('Contexto (equipe ou jogo) é obrigatório');

      if (idField === 'equipeId' && !equipeIds.includes(fkId)) {
        throw new ForbiddenError('Equipe inválida');
      }
      if (idField === 'jogoId') {
        const jogo = await prisma.jogo.findUnique({
          where: { id: fkId },
          select: { equipeId: true },
        });
        if (!jogo || !equipeIds.includes(jogo.equipeId)) {
          throw new ForbiddenError('Jogo inválido');
        }
      }

      let existingRecord = null;
      if (dateField === 'data') {
        const day = parseDay(body.data as string);
        existingRecord = await (model as { findFirst: (args: unknown) => Promise<{ id: string } | null> }).findFirst({
          where: { jogadorId, [idField]: fkId, data: day },
        });
      } else {
        existingRecord = await (model as { findFirst: (args: unknown) => Promise<{ id: string } | null> }).findFirst({
          where: { jogadorId, [idField]: fkId },
        });
      }

      const observacoes =
        typeof body.observacoes === 'string' ? body.observacoes : undefined;

      const m = model as {
        update: (args: unknown) => Promise<unknown>;
        create: (args: unknown) => Promise<unknown>;
      };
      const saved = existingRecord
        ? await m.update({
            where: { id: existingRecord.id },
            data: { valor: Number(value), observacoes },
          })
        : await m.create({
            data: {
              jogadorId,
              [idField]: fkId,
              valor: Number(value),
              observacoes,
              ...(dateField === 'data' ? { data: parseDay(body.data as string) } : {}),
            },
          });

      return res.json({ success: true, data: saved });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao salvar';
      const status =
        error instanceof ValidationError
          ? 400
          : error instanceof ForbiddenError
            ? 403
            : 500;
      return res.status(status).json({ success: false, error: msg });
    }
  },
};
