/**
 * Funil de testes gratuitos para o admin da plataforma.
 *
 * A métrica que orienta tudo é a TAXA DE ATIVAÇÃO — contas que registaram o
 * primeiro jogo real. Cadastro sem uso é ruído; jogo registado é intenção.
 * Ver docs/PLANO_MESTRE_TRIAL_30D.md (§4.4, §9).
 */

import { Request, Response } from 'express';
import prisma from '../config/database';
import { computeTrialEnd, daysUntil, getTrialDurationDays } from '../utils/subscription.helper';

const DAY_MS = 86_400_000;

export const trialAdminController = {
  /** GET /api/auth/admin/trials */
  list: async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * DAY_MS);
      const last30Days = new Date(now.getTime() - 30 * DAY_MS);

      const subscriptions = await prisma.subscription.findMany({
        where: { OR: [{ status: 'trialing' }, { status: 'expired' }] },
        orderBy: { createdAt: 'desc' },
        take: 500,
        select: {
          id: true,
          userId: true,
          plan: true,
          status: true,
          trialStartedAt: true,
          trialEndsAt: true,
          createdAt: true,
          user: {
            select: {
              email: true,
              name: true,
              teamDisplayName: true,
              isActive: true,
              lastLoginAt: true,
              emailVerifiedAt: true,
              tecnico: { select: { equipes: { select: { id: true } } } },
            },
          },
        },
      });

      // Uma consulta agregada em vez de N por utilizador.
      const equipeIds = subscriptions.flatMap((s) => s.user?.tecnico?.equipes.map((e) => e.id) ?? []);

      const matchCounts = equipeIds.length
        ? await prisma.jogo.groupBy({
            by: ['equipeId'],
            where: { equipeId: { in: equipeIds }, isDemo: false },
            _count: { id: true },
          })
        : [];

      const matchesByEquipe = new Map(matchCounts.map((row) => [row.equipeId, row._count.id]));

      const rows = subscriptions.map((sub) => {
        const teamIds = sub.user?.tecnico?.equipes.map((e) => e.id) ?? [];
        const matchCount = teamIds.reduce((total, id) => total + (matchesByEquipe.get(id) ?? 0), 0);
        const isExpired = sub.status === 'expired' || !sub.trialEndsAt || sub.trialEndsAt <= now;

        return {
          userId: sub.userId,
          email: sub.user?.email ?? '',
          name: sub.user?.name ?? '',
          teamName: sub.user?.teamDisplayName ?? null,
          plan: sub.plan,
          status: isExpired ? 'expired' : sub.status,
          signedUpAt: sub.trialStartedAt ?? sub.createdAt,
          trialEndsAt: sub.trialEndsAt,
          daysRemaining: sub.trialEndsAt && !isExpired ? daysUntil(sub.trialEndsAt, now) : 0,
          emailVerified: Boolean(sub.user?.emailVerifiedAt),
          lastLoginAt: sub.user?.lastLoginAt ?? null,
          matchCount,
          /** Ativação: pelo menos um jogo real registado. */
          isActivated: matchCount > 0,
          isActive: sub.user?.isActive ?? false,
        };
      });

      const active = rows.filter((r) => r.status === 'trialing');
      const expired = rows.filter((r) => r.status === 'expired');
      const recent = rows.filter((r) => r.signedUpAt && new Date(r.signedUpAt) >= last30Days);
      const activated = rows.filter((r) => r.isActivated);

      // Tempo médio até ativar, em dias — só entre quem ativou.
      const activationDays = activated
        .filter((r) => r.signedUpAt)
        .map((r) => (now.getTime() - new Date(r.signedUpAt).getTime()) / DAY_MS);

      return res.json({
        success: true,
        data: {
          summary: {
            activeTrials: active.length,
            expiringIn7Days: active.filter(
              (r) => r.trialEndsAt && new Date(r.trialEndsAt) <= in7Days
            ).length,
            expiredTrials: expired.length,
            activatedCount: activated.length,
            signupsLast30Days: recent.length,
            activationRate: rows.length > 0 ? Math.round((activated.length / rows.length) * 100) : 0,
            emailVerificationRate:
              rows.length > 0
                ? Math.round((rows.filter((r) => r.emailVerified).length / rows.length) * 100)
                : 0,
            avgDaysToActivate:
              activationDays.length > 0
                ? Number((activationDays.reduce((a, b) => a + b, 0) / activationDays.length).toFixed(1))
                : null,
          },
          rows,
        },
      });
    } catch (error) {
      console.error('[trialAdmin] Erro ao listar testes:', error);
      return res.status(500).json({ success: false, error: 'Erro ao carregar testes' });
    }
  },

  /**
   * POST /api/auth/admin/trials/:userId/extend
   * Retenção manual: dá mais tempo a quem pediu. Reabre um teste já expirado.
   */
  extend: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const days = parseInt(String(req.body?.days ?? getTrialDurationDays()), 10);

      if (!Number.isFinite(days) || days < 1 || days > 180) {
        return res.status(400).json({ success: false, error: 'Informe entre 1 e 180 dias.' });
      }

      const existing = await prisma.subscription.findUnique({ where: { userId } });
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Assinatura não encontrada' });
      }

      // Estende a partir de agora, ou do fim atual se ainda estiver no futuro —
      // assim estender um teste em curso soma tempo em vez de encurtar.
      const now = new Date();
      const base =
        existing.trialEndsAt && existing.trialEndsAt > now ? existing.trialEndsAt : now;

      const updated = await prisma.subscription.update({
        where: { userId },
        data: {
          status: 'trialing',
          trialEndsAt: computeTrialEnd(base, days),
          trialStartedAt: existing.trialStartedAt ?? now,
        },
        select: { trialEndsAt: true, status: true },
      });

      // Permite reenviar os e-mails de fim de teste no novo ciclo.
      await prisma.trialEmailLog.deleteMany({
        where: {
          userId,
          emailKey: { in: ['trial_day23_ending', 'trial_day28_final', 'trial_expired', 'trial_winback'] },
        },
      });

      return res.json({ success: true, data: updated });
    } catch (error) {
      console.error('[trialAdmin] Erro ao estender teste:', error);
      return res.status(500).json({ success: false, error: 'Erro ao estender teste' });
    }
  },
};
