/**
 * Platform admin — agregações cross-tenant para painel administrativo (JWT ADMINISTRADOR).
 */

import prisma from '../config/database';
import { env } from '../config/env';
import { isHermesWebConfigured } from '../services/webAssistant.service';
import {
  getLastMatchSummary,
  getMatchHistory,
  getPreMatchBriefing,
  getRosterStatus,
  getTeamReadiness,
} from '../services/insights/coachInsights.service';
import { listOpponentsWithSeed, listVideoRegistry } from '../services/insights/coachOpponents.service';
import { isWebSessionKey } from '../utils/assistantAudit.helper';
import { loadCoachTenantByUserId } from '../utils/coachAdmin.helper';

const STAFF_PLANS = ['ESSENCIAL', 'COMPETICAO', 'PERFORMANCE', 'ADMINISTRADOR'];

export async function getPlatformOverview() {
  const [
    totalUsers,
    inactiveUsers,
    usersByPlanRaw,
    equipeCount,
    jogadorCount,
    telegramCoachLinked,
    athletePortalLinked,
    auditLast24h,
    auditLast7d,
    webAuditLast24h,
    leadsLast30d,
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.groupBy({
      by: ['roleId'],
      where: { isActive: true },
      _count: { id: true },
    }),
    prisma.equipe.count(),
    prisma.jogador.count(),
    prisma.user.count({ where: { telegramCoachChatId: { not: null }, isActive: true } }),
    prisma.user.count({ where: { jogadorId: { not: null }, isActive: true } }),
    prisma.coachAssistantAudit.count({
      where: { createdAt: { gte: new Date(Date.now() - 86_400_000) } },
    }),
    prisma.coachAssistantAudit.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
    }),
    prisma.coachAssistantAudit.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 86_400_000) },
        telegramChatId: { startsWith: 'web:' },
      },
    }),
    prisma.lead.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
    }),
  ]);

  const roles = await prisma.role.findMany({ select: { id: true, name: true } });
  const roleNameById = Object.fromEntries(roles.map((r) => [r.id, r.name]));
  const usersByPlan: Record<string, number> = {};
  for (const row of usersByPlanRaw) {
    const name = roleNameById[row.roleId] ?? 'UNKNOWN';
    usersByPlan[name] = row._count.id;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUsers = await prisma.user.findMany({
    where: { createdAt: { gte: thirtyDaysAgo }, isActive: true },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  const registrationsByDay: Record<string, number> = {};
  for (const u of recentUsers) {
    const day = u.createdAt.toISOString().slice(0, 10);
    registrationsByDay[day] = (registrationsByDay[day] || 0) + 1;
  }

  const auditByDayRaw = await prisma.$queryRaw<{ day: string; count: bigint }[]>`
    SELECT to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, COUNT(*)::bigint AS count
    FROM coach_assistant_audit
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY 1
    ORDER BY 1 ASC
  `;
  const assistantCallsByDay: Record<string, number> = {};
  for (const row of auditByDayRaw) {
    assistantCallsByDay[row.day] = Number(row.count);
  }

  return {
    totalUsers,
    inactiveUsers,
    maxUsers: env.MAX_REGISTERED_USERS || null,
    remainingSlots: env.MAX_REGISTERED_USERS
      ? Math.max(0, env.MAX_REGISTERED_USERS - totalUsers)
      : null,
    usersByPlan,
    equipeCount,
    jogadorCount,
    telegramCoachLinked,
    athletePortalLinked,
    leadsLast30d,
    assistant: {
      callsLast24h: auditLast24h,
      callsLast7d: auditLast7d,
      webCallsLast24h: webAuditLast24h,
      callsByDay: assistantCallsByDay,
    },
    webAssistantEnabled: isHermesWebConfigured(),
    registrationsByDay,
  };
}

export async function listPlatformTenants(limit = 100) {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { name: { in: STAFF_PLANS } },
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      lastLoginAt: true,
      telegramCoachChatId: true,
      telegramChatId: true,
      role: { select: { name: true } },
      tecnico: {
        select: {
          id: true,
          equipes: {
            select: {
              id: true,
              nome: true,
              categoria: true,
              _count: { select: { jogadores: true, jogos: true } },
            },
          },
        },
      },
      clube: {
        select: {
          id: true,
          razaoSocial: true,
          cidade: true,
          estado: true,
          equipes: {
            select: {
              id: true,
              nome: true,
              categoria: true,
              _count: { select: { jogadores: true, jogos: true } },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
    take: Math.min(limit, 200),
  });

  return users.map((u) => {
    const equipes = u.tecnico?.equipes ?? u.clube?.equipes ?? [];
    return {
      userId: u.id,
      name: u.name,
      email: u.email,
      plan: u.role.name,
      tenantType: u.tecnico ? 'tecnico' : u.clube ? 'clube' : null,
      tenantLabel: u.tecnico?.id
        ? u.name
        : u.clube?.razaoSocial ?? null,
      equipeCount: equipes.length,
      jogadorCount: equipes.reduce((s, e) => s + e._count.jogadores, 0),
      jogoCount: equipes.reduce((s, e) => s + e._count.jogos, 0),
      equipes: equipes.map((e) => ({
        id: e.id,
        nome: e.nome,
        categoria: e.categoria,
        jogadores: e._count.jogadores,
        jogos: e._count.jogos,
      })),
      telegramCoachChatId: u.telegramCoachChatId,
      telegramAthleteChatId: u.telegramChatId,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    };
  });
}

export async function getPlatformUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      telegramCoachChatId: true,
      telegramChatId: true,
      jogadorId: true,
      teamDisplayName: true,
      role: { select: { name: true, description: true } },
      tecnico: {
        select: {
          id: true,
          cpf: true,
          registroProfissional: true,
          equipes: { select: { id: true, nome: true, categoria: true, temporada: true } },
        },
      },
      clube: {
        select: {
          id: true,
          razaoSocial: true,
          cnpj: true,
          cidade: true,
          estado: true,
          equipes: { select: { id: true, nome: true, categoria: true, temporada: true } },
        },
      },
      jogador: { select: { id: true, nome: true } },
    },
  });
  if (!user) return null;

  const sessionKeys: string[] = [];
  if (user.telegramCoachChatId) sessionKeys.push(user.telegramCoachChatId);
  sessionKeys.push(`web:${user.id}`);

  const [recentActivity, activityCount] = await Promise.all([
    prisma.coachAssistantAudit.findMany({
      where: {
        OR: [{ userId: user.id }, { telegramChatId: { in: sessionKeys } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.coachAssistantAudit.count({
      where: {
        OR: [{ userId: user.id }, { telegramChatId: { in: sessionKeys } }],
      },
    }),
  ]);

  return {
    ...user,
    plan: user.role.name,
    recentActivity: recentActivity.map(formatAuditRow),
    assistantActivityCount: activityCount,
  };
}

function formatAuditRow(row: {
  id: string;
  telegramChatId: string;
  userId: string | null;
  userName: string | null;
  endpoint: string;
  method: string;
  question: string | null;
  statusCode: number | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    source: isWebSessionKey(row.telegramChatId) ? 'web' : 'telegram',
    sessionKey: row.telegramChatId,
    userId: row.userId,
    userName: row.userName,
    endpoint: row.endpoint,
    method: row.method,
    question: row.question,
    statusCode: row.statusCode,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getAssistantActivity(params: {
  limit?: number;
  userId?: string;
  chatId?: string;
  source?: 'web' | 'telegram' | 'all';
}) {
  const limit = Math.min(params.limit ?? 50, 200);
  const where: Record<string, unknown> = {};

  if (params.userId) {
    where.OR = [
      { userId: params.userId },
      { telegramChatId: `web:${params.userId}` },
    ];
  } else if (params.chatId) {
    where.telegramChatId = params.chatId;
  }

  if (params.source === 'web') {
    where.telegramChatId = { startsWith: 'web:' };
  } else if (params.source === 'telegram') {
    where.telegramChatId = { not: { startsWith: 'web:' } };
  }

  const rows = await prisma.coachAssistantAudit.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const linked = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      telegramCoachChatId: true,
      role: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
  });

  const coachesWithTelegram = linked.filter((u) => u.telegramCoachChatId);
  const staffUsers = linked.filter((u) => STAFF_PLANS.includes(u.role.name));

  return {
    activity: rows.map(formatAuditRow),
    coachesWithTelegram: coachesWithTelegram.map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      plan: u.role.name,
      telegramCoachChatId: u.telegramCoachChatId,
    })),
    staffUsers: staffUsers.map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      plan: u.role.name,
      telegramCoachChatId: u.telegramCoachChatId,
      webSessionKey: `web:${u.id}`,
    })),
  };
}

export async function getUserInsightsPack(userId: string) {
  const loaded = await loadCoachTenantByUserId(userId);
  if (!loaded) return null;

  const { tenantInfo, userName, email, roleName } = loaded;
  if (!tenantInfo.equipe_ids?.length && roleName !== 'ADMINISTRADOR') {
    return {
      userId,
      userName,
      email,
      roleName,
      equipeCount: 0,
      message: 'Usuário sem equipes vinculadas — insights indisponíveis.',
      briefing: null,
      readiness: null,
      lastMatch: null,
      matchHistory: null,
      roster: null,
      opponents: null,
      videos: null,
    };
  }

  const [briefing, readiness, lastMatch, matchHistory, roster, opponents, videos] =
    await Promise.all([
      getPreMatchBriefing(tenantInfo),
      getTeamReadiness(tenantInfo),
      getLastMatchSummary(tenantInfo),
      getMatchHistory(tenantInfo),
      getRosterStatus(tenantInfo),
      listOpponentsWithSeed(tenantInfo),
      listVideoRegistry(tenantInfo),
    ]);

  return {
    userId,
    userName,
    email,
    roleName,
    equipeCount: tenantInfo.equipe_ids?.length ?? 0,
    briefing,
    readiness,
    lastMatch,
    matchHistory,
    roster,
    opponents,
    videos,
  };
}

export async function getSystemHealth() {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return {
    database: dbOk ? 'ok' : 'error',
    assistantServiceToken: Boolean(env.ASSISTANT_SERVICE_TOKEN?.trim()),
    coachAdminAuditKey: Boolean(env.COACH_ADMIN_AUDIT_KEY?.trim()),
    hermesWeb: isHermesWebConfigured(),
    maxRegisteredUsers: env.MAX_REGISTERED_USERS || null,
    nodeEnv: env.NODE_ENV ?? process.env.NODE_ENV ?? 'unknown',
  };
}
