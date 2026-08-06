/**
 * Ciclo de vida do teste gratuito — executado uma vez por dia pelo cron.
 *
 * Duas responsabilidades:
 *  1. enviar o e-mail certo no dia certo (calendário em §5.2 do plano mestre);
 *  2. marcar como `expired` os testes vencidos — para relatório apenas, já que
 *     o enforcement real é calculado por data em cada requisição.
 *
 * Idempotência: cada envio grava uma linha em `trial_email_logs` com unique
 * (user_id, email_key). Se o cron correr duas vezes no mesmo dia, o segundo
 * envio falha no unique e é ignorado. Isto importa no Vercel, onde uma execução
 * pode ser reentregue.
 */

import prisma from '../config/database';
import { sendTrialLifecycleEmail } from './email/email.service';
import type { TrialEmailKey } from './email/templates/trial-lifecycle';
import { getTrialDurationDays } from '../utils/subscription.helper';

const DAY_MS = 86_400_000;

/**
 * Dia do teste → e-mail. O dia é contado a partir de `trialStartedAt`.
 * `requiresInactive: true` significa que o e-mail só vai para quem ainda não
 * ativou — não faz sentido mandar "primeiros passos" a quem já regista jogos.
 */
const SCHEDULE: Array<{ day: number; key: TrialEmailKey; requiresInactive?: boolean }> = [
  { day: 1, key: 'trial_day1_start', requiresInactive: true },
  { day: 3, key: 'trial_day3_tip', requiresInactive: true },
  { day: 7, key: 'trial_day7_checkin' },
  { day: 15, key: 'trial_day15_midpoint' },
  { day: 23, key: 'trial_day23_ending' },
  { day: 28, key: 'trial_day28_final' },
];

export interface LifecycleRunResult {
  processed: number;
  emailsSent: number;
  expiredMarked: number;
  skipped: number;
  errors: number;
}

function daysSince(start: Date, now: Date): number {
  return Math.floor((now.getTime() - start.getTime()) / DAY_MS);
}

/** Estatísticas da conta, para personalizar o e-mail. */
async function accountStats(userId: string): Promise<{ playerCount: number; matchCount: number }> {
  const tecnico = await prisma.tecnico.findUnique({
    where: { userId },
    select: { equipes: { select: { id: true } } },
  });

  const equipeIds = tecnico?.equipes.map((e) => e.id) ?? [];
  if (equipeIds.length === 0) return { playerCount: 0, matchCount: 0 };

  const [playerCount, matchCount] = await Promise.all([
    prisma.equipesJogadores.count({
      where: { equipeId: { in: equipeIds }, dataFim: null, jogador: { isDemo: false } },
    }),
    prisma.jogo.count({ where: { equipeId: { in: equipeIds }, isDemo: false } }),
  ]);

  return { playerCount, matchCount };
}

/** Grava o log de envio. Devolve false se já tinha sido enviado (unique violation). */
async function claimEmailSlot(userId: string, emailKey: TrialEmailKey): Promise<boolean> {
  try {
    await prisma.trialEmailLog.create({ data: { userId, emailKey } });
    return true;
  } catch {
    return false;
  }
}

export async function runTrialLifecycle(now: Date = new Date()): Promise<LifecycleRunResult> {
  const result: LifecycleRunResult = { processed: 0, emailsSent: 0, expiredMarked: 0, skipped: 0, errors: 0 };
  const trialDays = getTrialDurationDays();

  // ── 1. Testes em curso: e-mails do calendário ──
  const trialing = await prisma.subscription.findMany({
    where: { status: 'trialing', trialEndsAt: { gt: now } },
    select: {
      userId: true,
      trialStartedAt: true,
      trialEndsAt: true,
      user: { select: { email: true, name: true, isActive: true, emailVerifiedAt: true } },
    },
  });

  for (const sub of trialing) {
    result.processed += 1;

    if (!sub.user?.isActive || !sub.trialStartedAt || !sub.trialEndsAt) {
      result.skipped += 1;
      continue;
    }

    // Não perseguir quem nunca confirmou o e-mail: o endereço pode nem existir,
    // e insistir só piora a reputação de envio do domínio.
    if (!sub.user.emailVerifiedAt) {
      result.skipped += 1;
      continue;
    }

    const day = daysSince(sub.trialStartedAt, now);
    const entry = SCHEDULE.find((item) => item.day === day);
    if (!entry) {
      result.skipped += 1;
      continue;
    }

    try {
      const stats = await accountStats(sub.userId);

      if (entry.requiresInactive && stats.matchCount > 0) {
        result.skipped += 1;
        continue;
      }

      // Reserva o slot ANTES de enviar: se o envio falhar, preferimos perder
      // um e-mail a mandar dois.
      if (!(await claimEmailSlot(sub.userId, entry.key))) {
        result.skipped += 1;
        continue;
      }

      await sendTrialLifecycleEmail(
        entry.key,
        { userId: sub.userId, email: sub.user.email, name: sub.user.name },
        {
          daysRemaining: Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - now.getTime()) / DAY_MS)),
          trialDays,
          ...stats,
        }
      );

      result.emailsSent += 1;
    } catch (error) {
      console.error(`[trialLifecycle] Falha ao processar ${sub.userId}:`, error);
      result.errors += 1;
    }
  }

  // ── 2. Testes vencidos: marcar e avisar ──
  const justExpired = await prisma.subscription.findMany({
    where: { status: 'trialing', trialEndsAt: { lte: now } },
    select: {
      id: true,
      userId: true,
      trialEndsAt: true,
      user: { select: { email: true, name: true, isActive: true, emailVerifiedAt: true } },
    },
  });

  for (const sub of justExpired) {
    try {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'expired' },
      });
      result.expiredMarked += 1;

      if (!sub.user?.isActive || !sub.user.emailVerifiedAt) continue;
      if (!(await claimEmailSlot(sub.userId, 'trial_expired'))) continue;

      const stats = await accountStats(sub.userId);
      await sendTrialLifecycleEmail(
        'trial_expired',
        { userId: sub.userId, email: sub.user.email, name: sub.user.name },
        { daysRemaining: 0, trialDays, ...stats }
      );
      result.emailsSent += 1;
    } catch (error) {
      console.error(`[trialLifecycle] Falha ao expirar ${sub.userId}:`, error);
      result.errors += 1;
    }
  }

  // ── 3. Win-back: 7 dias após a expiração ──
  const winbackFrom = new Date(now.getTime() - 8 * DAY_MS);
  const winbackTo = new Date(now.getTime() - 7 * DAY_MS);

  const winback = await prisma.subscription.findMany({
    where: { status: 'expired', trialEndsAt: { gte: winbackFrom, lt: winbackTo } },
    select: {
      userId: true,
      user: { select: { email: true, name: true, isActive: true, emailVerifiedAt: true } },
    },
  });

  for (const sub of winback) {
    try {
      if (!sub.user?.isActive || !sub.user.emailVerifiedAt) continue;
      if (!(await claimEmailSlot(sub.userId, 'trial_winback'))) continue;

      const stats = await accountStats(sub.userId);
      await sendTrialLifecycleEmail(
        'trial_winback',
        { userId: sub.userId, email: sub.user.email, name: sub.user.name },
        { daysRemaining: 0, trialDays, ...stats }
      );
      result.emailsSent += 1;
    } catch (error) {
      console.error(`[trialLifecycle] Falha no win-back de ${sub.userId}:`, error);
      result.errors += 1;
    }
  }

  return result;
}
