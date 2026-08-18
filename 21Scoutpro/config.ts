/**
 * Configuração da API
 * Backend PostgreSQL - SCOUT 21 PRO
 *
 * Rodando local com backend online: crie .env.local com
 *   VITE_API_URL=https://sua-api.vercel.app/api
 * (ou a URL do seu backend em produção). Assim o front local usa os dados do backend online.
 */

import type { User } from './types';

// URL do Backend PostgreSQL
// Em desenvolvimento: http://localhost:3000/api
// Em produção: usar URL relativa (/api) se VITE_API_URL não estiver definida
export const getApiUrl = () => {
  // No browser, o host real manda: o build da Vercel já chegou a emitir
  // `localhost:3000/api` com import.meta.env.PROD=false, e o login quebra.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return '/api';
    }
  }

  if (import.meta.env.PROD) {
    return '/api';
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl;
  }

  return 'http://localhost:3000/api';
};

export const API_URL = getApiUrl();

/** Versão free (build): fallback quando `planName` não veio do backend (sessão antiga) */
export const IS_FREE_PLAN = (import.meta.env.VITE_PLAN ?? 'free') === 'free';

/**
 * UI com cadeados / “Em breve” apenas no plano Essencial.
 * COMPETICAO, PERFORMANCE e ADMINISTRADOR: sem restrições de UI de plano.
 * Sem `planName`: mantém comportamento antigo via `IS_FREE_PLAN`.
 */
export function isEssentialPlanUser(user: User | null): boolean {
  if (user?.planName === 'ESSENCIAL') return true;
  if (user?.planName != null) return false;
  return IS_FREE_PLAN;
}

/** Telas de Fisiologia e cadeados do menu: apenas Performance ou admin da plataforma */
export function isPerformanceTierUser(user: User | null): boolean {
  if (!user) return false;
  if (user.isPlatformAdmin || user.planName === 'ADMINISTRADOR') return true;
  return user.planName === 'PERFORMANCE';
}

// Mapeamento de recursos para rotas da API
// Mantido para compatibilidade com services/api.ts
export const API_RESOURCES = {
  players: 'players',
  matches: 'matches',
  matchPlayerStats: 'match-player-stats',
  injuries: 'injuries',
  assessments: 'assessments',
  schedules: 'schedules',
  scheduleDays: 'schedule-days',
  competitions: 'competitions',
  statTargets: 'stat-targets',
  users: 'users',
  timeControls: 'time-controls',
  championshipMatches: 'championship-matches',
  teams: 'teams'
} as const;


