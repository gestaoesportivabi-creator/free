/**
 * Controller de conta — estado do teste gratuito e progresso de ativação.
 *
 * Vive sob /api/me mas ANTES do gate `requireAthlete`: estas rotas servem
 * técnicos e clubes, não atletas.
 */

import { Request, Response } from 'express';
import prisma from '../config/database';

export const accountController = {
  /**
   * GET /api/me/subscription
   * Estado comercial da conta. Responde mesmo com o teste expirado — é o que
   * permite ao frontend desenhar a tela de expiração em vez de um erro seco.
   */
  getSubscription: async (req: Request, res: Response) => {
    const access = req.access;

    if (!access) {
      return res.status(500).json({ success: false, error: 'Contexto de assinatura indisponível' });
    }

    return res.json({
      success: true,
      data: {
        plan: access.plan,
        status: access.status,
        isTrialing: access.isTrialing,
        trialDaysRemaining: access.trialDaysRemaining,
        trialEndsAt: access.trialEndsAt,
        isExpired: access.isExpired,
        emailVerificationOverdue: access.emailVerificationOverdue,
      },
    });
  },

  /**
   * GET /api/me/onboarding
   * Progresso do checklist de ativação. "Ativado" = primeiro jogo real
   * registado (não-demo) — a métrica que separa curiosidade de uso.
   */
  getOnboarding: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          emailVerifiedAt: true,
          tecnico: { select: { id: true } },
          clube: { select: { id: true } },
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      }

      const equipeIds = req.tenantInfo?.equipe_ids ?? [];
      const hasTeam = equipeIds.length > 0;

      const [playerCount, realMatchCount, demoMatchCount] = hasTeam
        ? await Promise.all([
            prisma.equipesJogadores.count({ where: { equipeId: { in: equipeIds }, dataFim: null } }),
            prisma.jogo.count({ where: { equipeId: { in: equipeIds }, isDemo: false } }),
            prisma.jogo.count({ where: { equipeId: { in: equipeIds }, isDemo: true } }),
          ])
        : [0, 0, 0];

      // O checklist deve ensinar o primeiro uso do produto. A confirmação de
      // e-mail é importante para o ciclo do teste, mas não pode manter a
      // pessoa presa no último passo depois de já começar a usar a plataforma.
      const steps = [
        { id: 'account', label: 'Conta criada', done: true },
        { id: 'team', label: 'Equipa cadastrada', done: hasTeam },
        { id: 'roster', label: 'Adicionar atletas ao elenco', done: playerCount > 0, href: '/dashboard?tab=elenco' },
        { id: 'match', label: 'Registar o primeiro jogo', done: realMatchCount > 0, href: '/dashboard?tab=table' },
      ];

      const completed = steps.filter((step) => step.done).length;

      return res.json({
        success: true,
        data: {
          steps,
          completed,
          total: steps.length,
          isComplete: completed === steps.length,
          /** Ativação de verdade: um jogo real coletado. */
          isActivated: realMatchCount > 0,
          emailVerified: Boolean(user.emailVerifiedAt),
          playerCount,
          matchCount: realMatchCount,
          hasDemoData: demoMatchCount > 0,
        },
      });
    } catch (error) {
      console.error('[account] Erro ao calcular onboarding:', error);
      return res.status(500).json({ success: false, error: 'Erro ao carregar progresso' });
    }
  },
};
