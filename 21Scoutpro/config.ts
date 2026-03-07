/**
 * Configuração da API
 * Backend PostgreSQL - SCOUT 21 PRO
 *
 * Rodando local com backend online: crie .env.local com
 *   VITE_API_URL=https://sua-api.vercel.app/api
 * (ou a URL do seu backend em produção). Assim o front local usa os dados do backend online.
 */

// URL do Backend PostgreSQL
// Em desenvolvimento: http://localhost:3000/api
// Em produção: usar URL relativa (/api) se VITE_API_URL não estiver definida
export const getApiUrl = () => {
  // Vite usa import.meta.env ao invés de process.env
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // Se VITE_API_URL estiver definida, usar ela
  if (apiUrl) {
    return apiUrl;
  }
  
  // Se estiver em produção (Vercel), usar URL relativa
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // Em desenvolvimento, usar localhost
  return 'http://localhost:3000/api';
};

export const API_URL = getApiUrl();

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


