/**
 * Resolução do acesso efetivo de uma conta.
 *
 * `Role` no Scout determina o TIPO DE TENANT (ESSENCIAL→Tecnico, COMPETICAO→Clube),
 * por isso não serve como fonte de verdade do plano comercial. Quem manda em features
 * é `Subscription` — ver docs/PLANO_MESTRE_TRIAL_30D.md (§2.1, §2.2).
 *
 * Regra de ouro: a expiração é sempre CALCULADA por data, nunca lida de um flag.
 * O cron pode marcar `expired` para relatório, mas a autoridade é `trialEndsAt <= now`.
 */

import type { Subscription, SubscriptionStatus } from '@prisma/client';

export type PlanName = 'ESSENCIAL' | 'COMPETICAO' | 'PERFORMANCE' | 'ADMINISTRADOR';

export interface EffectiveAccess {
  /** Plano que vale para liberar features agora. */
  plan: PlanName;
  status: SubscriptionStatus;
  isTrialing: boolean;
  /** Dias inteiros restantes do teste; null fora de trial. */
  trialDaysRemaining: number | null;
  trialEndsAt: Date | null;
  /** true → escrita bloqueada; leitura e exportação continuam livres. */
  isExpired: boolean;
}

export interface AccessUserInput {
  roleName: string;
  emailVerifiedAt?: Date | null;
  createdAt?: Date;
}

const DAY_MS = 86_400_000;
const PLAN_FALLBACK: PlanName = 'ESSENCIAL';

function asPlan(value: string | null | undefined): PlanName {
  if (value === 'ESSENCIAL' || value === 'COMPETICAO' || value === 'PERFORMANCE' || value === 'ADMINISTRADOR') {
    return value;
  }
  return PLAN_FALLBACK;
}

/** Dias inteiros que faltam até `end`, nunca negativo. */
export function daysUntil(end: Date, now: Date): number {
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / DAY_MS));
}

export function resolveEffectiveAccess(
  user: AccessUserInput,
  subscription: Subscription | null | undefined,
  now: Date = new Date()
): EffectiveAccess {
  // Admin da plataforma nunca é limitado por assinatura.
  if (user.roleName === 'ADMINISTRADOR') {
    return {
      plan: 'ADMINISTRADOR',
      status: 'active',
      isTrialing: false,
      trialDaysRemaining: null,
      trialEndsAt: null,
      isExpired: false,
    };
  }

  // Contas anteriores ao teste gratuito (e atletas, que herdam acesso do técnico)
  // não têm assinatura. Mantêm o acesso que sempre tiveram.
  if (!subscription) {
    return {
      plan: asPlan(user.roleName),
      status: 'active',
      isTrialing: false,
      trialDaysRemaining: null,
      trialEndsAt: null,
      isExpired: false,
    };
  }

  if (subscription.status === 'trialing') {
    const endsAt = subscription.trialEndsAt;
    const expired = !endsAt || endsAt.getTime() <= now.getTime();

    if (expired) {
      return {
        plan: 'ESSENCIAL',
        status: 'expired',
        isTrialing: false,
        trialDaysRemaining: 0,
        trialEndsAt: endsAt ?? null,
        isExpired: true,
      };
    }

    return {
      plan: asPlan(subscription.plan),
      status: 'trialing',
      isTrialing: true,
      trialDaysRemaining: daysUntil(endsAt, now),
      trialEndsAt: endsAt,
      isExpired: false,
    };
  }

  if (subscription.status === 'expired' || subscription.status === 'canceled') {
    return {
      plan: 'ESSENCIAL',
      status: subscription.status,
      isTrialing: false,
      trialDaysRemaining: 0,
      trialEndsAt: subscription.trialEndsAt ?? null,
      isExpired: true,
    };
  }

  // `past_due`: pagamento falhou mas ainda não cortámos o acesso — período de cortesia.
  // Quando o billing entrar, é aqui que a política de dunning decide.
  return {
    plan: asPlan(subscription.plan),
    status: subscription.status,
    isTrialing: false,
    trialDaysRemaining: null,
    trialEndsAt: subscription.trialEndsAt ?? null,
    isExpired: false,
  };
}

/**
 * Quotas por plano. Durante o teste o plano efetivo é PERFORMANCE, portanto
 * nada é limitado — as quotas só mordem depois do rebaixamento.
 * Os números do Essencial espelham o que a landing promete.
 */
export const PLAN_QUOTAS: Record<PlanName, { maxMatches: number; maxChampionships: number; maxPlayers: number }> = {
  ESSENCIAL: { maxMatches: 10, maxChampionships: 1, maxPlayers: 30 },
  COMPETICAO: { maxMatches: Infinity, maxChampionships: Infinity, maxPlayers: 60 },
  PERFORMANCE: { maxMatches: Infinity, maxChampionships: Infinity, maxPlayers: Infinity },
  ADMINISTRADOR: { maxMatches: Infinity, maxChampionships: Infinity, maxPlayers: Infinity },
};

/** Duração do teste, configurável por ambiente. */
export function getTrialDurationDays(): number {
  const raw = parseInt(process.env.TRIAL_DURATION_DAYS || '30', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 30;
}

/** Plano concedido durante o teste. Dar o produto completo é o que vende o produto. */
export function getTrialPlan(): PlanName {
  return asPlan(process.env.TRIAL_PLAN || 'PERFORMANCE');
}

export function computeTrialEnd(startedAt: Date, days: number = getTrialDurationDays()): Date {
  return new Date(startedAt.getTime() + days * DAY_MS);
}

/**
 * Prazo de tolerância para verificar o e-mail. Passado isso, a escrita é
 * bloqueada como se o teste tivesse expirado — evita base cheia de e-mail falso
 * sem matar a ativação de quem só não clicou no link ainda.
 */
export function getEmailVerificationGraceDays(): number {
  const raw = parseInt(process.env.EMAIL_VERIFICATION_GRACE_DAYS || '7', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 7;
}

export function isEmailVerificationOverdue(
  user: AccessUserInput,
  subscription: Subscription | null | undefined,
  now: Date = new Date()
): boolean {
  if (user.emailVerifiedAt) return false;
  if (user.roleName === 'ADMINISTRADOR') return false;

  // Só se aplica a contas de auto-cadastro; contas legadas não têm assinatura.
  const startedAt = subscription?.trialStartedAt ?? subscription?.createdAt;
  if (!startedAt) return false;

  const deadline = startedAt.getTime() + getEmailVerificationGraceDays() * DAY_MS;
  return now.getTime() > deadline;
}
