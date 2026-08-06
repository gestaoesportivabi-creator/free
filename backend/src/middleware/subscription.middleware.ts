/**
 * Enforcement do teste gratuito.
 *
 * Antes deste middleware o Scout não tinha NENHUMA trava de plano no servidor —
 * todo o gating era cadeado visual no React, contornável com F12. Um teste que
 * "expira" só no cliente é decorativo. Ver docs/PLANO_MESTRE_TRIAL_30D.md (§1.2, §2.3).
 *
 * Semântica escolhida — degradação, não muro:
 *   • leitura   → sempre permitida, mesmo expirado (o técnico nunca perde o que coletou)
 *   • escrita   → 402 Payment Required quando expirado
 *   • exportar  → sempre permitida (LGPD, portabilidade)
 *
 * Deve correr DEPOIS de authMiddleware e ANTES de tenantMiddleware.
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import {
  EffectiveAccess,
  isEmailVerificationOverdue,
  resolveEffectiveAccess,
} from '../utils/subscription.helper';

declare global {
  namespace Express {
    interface Request {
      access?: EffectiveAccess & { emailVerificationOverdue: boolean };
    }
  }
}

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Anexa `req.access` sem bloquear nada. Usar em rotas que precisam responder
 * mesmo com o teste expirado (ex.: /api/me, exportações).
 */
export function subscriptionContext() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      }

      const record = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          createdAt: true,
          emailVerifiedAt: true,
          role: { select: { name: true } },
          subscription: true,
        },
      });

      if (!record) {
        return res.status(401).json({ success: false, error: 'Usuário não encontrado' });
      }

      const userInput = {
        roleName: record.role?.name ?? 'ESSENCIAL',
        emailVerifiedAt: record.emailVerifiedAt,
        createdAt: record.createdAt,
      };

      const access = resolveEffectiveAccess(userInput, record.subscription);

      req.access = {
        ...access,
        emailVerificationOverdue: isEmailVerificationOverdue(userInput, record.subscription),
      };

      next();
      return;
    } catch (error) {
      console.error('[subscriptionMiddleware] Erro ao resolver acesso:', error);
      return res.status(500).json({ success: false, error: 'Erro ao verificar assinatura' });
    }
  };
}

/**
 * Bloqueia escrita quando o teste expirou ou quando o e-mail não foi verificado
 * dentro do prazo. Leitura passa sempre.
 */
export function requireActiveSubscription() {
  return (req: Request, res: Response, next: NextFunction) => {
    const access = req.access;

    if (!access) {
      console.error('[subscriptionMiddleware] requireActiveSubscription sem subscriptionContext()');
      return res.status(500).json({ success: false, error: 'Contexto de assinatura indisponível' });
    }

    if (READ_METHODS.has(req.method)) {
      next();
      return;
    }

    if (access.isExpired) {
      return res.status(402).json({
        success: false,
        error: 'trial_expired',
        message:
          'Seu teste de 30 dias terminou. Seus dados continuam salvos e podem ser consultados e exportados.',
        trialEndedAt: access.trialEndsAt,
      });
    }

    if (access.emailVerificationOverdue) {
      return res.status(403).json({
        success: false,
        error: 'email_not_verified',
        message:
          'Confirme seu e-mail para continuar registando dados. Reenvie o link a partir do seu perfil.',
      });
    }

    next();
    return;
  };
}

/**
 * Atalho para as rotas de dados: contexto + bloqueio numa tupla só.
 * Usar como `...subscriptionGuard()` na composição de middlewares.
 */
export function subscriptionGuard() {
  return [subscriptionContext(), requireActiveSubscription()] as const;
}
