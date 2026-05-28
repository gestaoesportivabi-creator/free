/**
 * Resumo de fisiologia do atleta (portal web + Telegram)
 */

import { randomUUID } from 'crypto';
import prisma from '../config/database';
import { getAthleteEquipeIds } from '../utils/athleteAccount.helper';
import { ValidationError } from '../utils/errors';

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDay(input?: string): Date {
  if (input && input.length >= 10) {
    return new Date(input.slice(0, 10) + 'T12:00:00.000Z');
  }
  return new Date(todayDateString() + 'T12:00:00.000Z');
}

export interface AthleteTodaySummary {
  date: string;
  equipeId: string | null;
  recentMatchId: string | null;
  hasTrainingToday: boolean;
  recentMatchOpponent: string | null;
  tasks: {
    bemEstarDiario: { required: boolean; completed: boolean };
    pseTreino: { required: boolean; completed: boolean };
    psrTreino: { required: boolean; completed: boolean };
    pseJogo: { required: boolean; completed: boolean };
    psrJogo: { required: boolean; completed: boolean };
  };
}

export async function getAthleteTodaySummary(jogadorId: string): Promise<AthleteTodaySummary> {
  const equipeIds = await getAthleteEquipeIds(jogadorId);
  const equipeId = equipeIds[0] ?? null;
  const today = parseDay(todayDateString());

  const hasTrainingToday = equipeId
    ? await prisma.programacoesDias.findFirst({
        where: {
          programacao: { equipeId, isAtivo: true },
          data: today,
          atividade: { contains: 'Treino', mode: 'insensitive' },
        },
      })
    : null;

  const recentMatch = equipeId
    ? await prisma.jogo.findFirst({
        where: { equipeId, data: { lte: today } },
        orderBy: { data: 'desc' },
      })
    : null;

  const [bemEstar, pseTreino, psrTreino, pseJogo, psrJogo] = await Promise.all([
    equipeId
      ? prisma.bem_estar_diario.findFirst({
          where: { jogador_id: jogadorId, equipe_id: equipeId, data: today },
        })
      : null,
    equipeId
      ? prisma.pseTreino.findFirst({
          where: { jogadorId, equipeId, data: today },
        })
      : null,
    equipeId
      ? prisma.psrTreino.findFirst({
          where: { jogadorId, equipeId, data: today },
        })
      : null,
    recentMatch
      ? prisma.pseJogo.findFirst({
          where: { jogadorId, jogoId: recentMatch.id },
        })
      : null,
    recentMatch
      ? prisma.psrJogo.findFirst({
          where: { jogadorId, jogoId: recentMatch.id },
        })
      : null,
  ]);

  return {
    date: todayDateString(),
    equipeId,
    recentMatchId: recentMatch?.id ?? null,
    hasTrainingToday: !!hasTrainingToday,
    recentMatchOpponent: recentMatch?.adversario ?? null,
    tasks: {
      bemEstarDiario: { required: true, completed: !!bemEstar },
      pseTreino: { required: !!hasTrainingToday, completed: !!pseTreino },
      psrTreino: { required: !!hasTrainingToday, completed: !!psrTreino },
      pseJogo: { required: !!recentMatch, completed: !!pseJogo },
      psrJogo: { required: !!recentMatch, completed: !!psrJogo },
    },
  };
}

export function formatTodaySummaryForTelegram(
  athleteName: string,
  summary: AthleteTodaySummary
): string {
  const lines: string[] = [
    `📋 Hoje — ${athleteName}`,
    `📅 ${summary.date}`,
    '',
  ];

  const taskLine = (label: string, t: { required: boolean; completed: boolean }) => {
    if (!t.required) return;
    lines.push(`${t.completed ? '✅' : '⏳'} ${label}`);
  };

  taskLine('Bem-estar diário', summary.tasks.bemEstarDiario);
  taskLine('PSE treino', summary.tasks.pseTreino);
  taskLine('PSR pós-treino', summary.tasks.psrTreino);
  if (summary.recentMatchOpponent) {
    taskLine(`PSE jogo vs ${summary.recentMatchOpponent}`, summary.tasks.pseJogo);
    taskLine(`PSR jogo vs ${summary.recentMatchOpponent}`, summary.tasks.psrJogo);
  }

  const pending = [
    summary.tasks.bemEstarDiario,
    summary.tasks.pseTreino,
    summary.tasks.psrTreino,
    summary.tasks.pseJogo,
    summary.tasks.psrJogo,
  ].filter((t) => t.required && !t.completed).length;

  lines.push('');
  if (pending === 0) {
    lines.push('🎉 Tudo preenchido para hoje!');
  } else {
    lines.push(`Faltam ${pending} registro(s). Toque em "Preencher" abaixo ou use /preencher.`);
  }

  return lines.join('\n');
}

function assertScale(value: number, label = 'Valor') {
  if (!Number.isInteger(value) || value < 0 || value > 10) {
    throw new ValidationError(`${label} deve ser entre 0 e 10`);
  }
}

export async function saveBemEstarDiario(
  jogadorId: string,
  equipeId: string,
  scores: {
    stress: number;
    sono: number;
    humor: number;
    dor: number;
    satisfacao: number;
  }
): Promise<void> {
  Object.entries(scores).forEach(([k, v]) => assertScale(v, k));
  const day = parseDay(todayDateString());
  const existing = await prisma.bem_estar_diario.findFirst({
    where: { equipe_id: equipeId, jogador_id: jogadorId, data: day },
  });
  const updateData = {
    nivel_stress: scores.stress,
    qual_sono: scores.sono,
    humor_mot: scores.humor,
    dor_muscular: scores.dor,
    satisfacao: scores.satisfacao,
    updated_at: new Date(),
  };
  if (existing) {
    await prisma.bem_estar_diario.update({ where: { id: existing.id }, data: updateData });
  } else {
    await prisma.bem_estar_diario.create({
      data: {
        id: randomUUID(),
        equipe_id: equipeId,
        jogador_id: jogadorId,
        data: day,
        created_at: new Date(),
        ...updateData,
      },
    });
  }
}

async function upsertDailyTreinoMetric(
  kind: 'pse' | 'psr',
  jogadorId: string,
  equipeId: string,
  valor: number
): Promise<void> {
  assertScale(valor);
  const day = parseDay(todayDateString());
  if (kind === 'pse') {
    const existing = await prisma.pseTreino.findFirst({
      where: { jogadorId, equipeId, data: day },
    });
    if (existing) {
      await prisma.pseTreino.update({ where: { id: existing.id }, data: { valor } });
    } else {
      await prisma.pseTreino.create({
        data: { jogadorId, equipeId, data: day, valor },
      });
    }
    return;
  }
  const existing = await prisma.psrTreino.findFirst({
    where: { jogadorId, equipeId, data: day },
  });
  if (existing) {
    await prisma.psrTreino.update({ where: { id: existing.id }, data: { valor } });
  } else {
    await prisma.psrTreino.create({
      data: { jogadorId, equipeId, data: day, valor },
    });
  }
}

export function savePseTreino(jogadorId: string, equipeId: string, valor: number) {
  return upsertDailyTreinoMetric('pse', jogadorId, equipeId, valor);
}

export function savePsrTreino(jogadorId: string, equipeId: string, valor: number) {
  return upsertDailyTreinoMetric('psr', jogadorId, equipeId, valor);
}

async function upsertMatchTreinoMetric(
  kind: 'pse' | 'psr',
  jogadorId: string,
  jogoId: string,
  valor: number
): Promise<void> {
  assertScale(valor);
  if (kind === 'pse') {
    const existing = await prisma.pseJogo.findFirst({ where: { jogadorId, jogoId } });
    if (existing) {
      await prisma.pseJogo.update({ where: { id: existing.id }, data: { valor } });
    } else {
      await prisma.pseJogo.create({ data: { jogadorId, jogoId, valor } });
    }
    return;
  }
  const existing = await prisma.psrJogo.findFirst({ where: { jogadorId, jogoId } });
  if (existing) {
    await prisma.psrJogo.update({ where: { id: existing.id }, data: { valor } });
  } else {
    await prisma.psrJogo.create({ data: { jogadorId, jogoId, valor } });
  }
}

export function savePseJogo(jogadorId: string, jogoId: string, valor: number) {
  return upsertMatchTreinoMetric('pse', jogadorId, jogoId, valor);
}

export function savePsrJogo(jogadorId: string, jogoId: string, valor: number) {
  return upsertMatchTreinoMetric('psr', jogadorId, jogoId, valor);
}

export function countPendingTasks(summary: AthleteTodaySummary): number {
  return [
    summary.tasks.bemEstarDiario,
    summary.tasks.pseTreino,
    summary.tasks.psrTreino,
    summary.tasks.pseJogo,
    summary.tasks.psrJogo,
  ].filter((t) => t.required && !t.completed).length;
}
