/**
 * Resumo de fisiologia do atleta (portal web + Telegram)
 */

import prisma from '../config/database';
import { getAthleteEquipeIds } from '../utils/athleteAccount.helper';

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
    lines.push(`Faltam ${pending} registro(s). Use o app: gestaoesportiva-free.vercel.app`);
  }

  return lines.join('\n');
}
