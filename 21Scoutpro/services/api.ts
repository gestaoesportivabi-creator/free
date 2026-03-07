/**
 * Serviço de API para comunicação com Backend PostgreSQL
 * 
 * Interface mantida para compatibilidade com frontend existente
 * Backend retorna formato ApiResponse<T> padrão
 */

import { getApiUrl, API_RESOURCES } from '../config';
import { Player, MatchRecord, PhysicalAssessment, WeeklySchedule, StatTargets, Team } from '../types';

// Tipos de resposta da API
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Função genérica para fazer requisições GET
 */
async function get<T>(resource: string, id?: string): Promise<T[]> {
  try {
    const path = id ? `${resource}/${id}` : resource;
    const url = `${getApiUrl()}/${path}`;
    const token = localStorage.getItem('token') || '';
    console.log(`📡 GET ${resource}:`, url);
    console.log(`🔑 Token presente:`, token ? 'SIM' : 'NÃO', token ? `(${token.substring(0, 20)}...)` : '');
    
    // Timeout 25s (matches e outros recursos podem demorar no primeiro request)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response text:', text);
      return [];
    }

    let result: ApiResponse<T[]>;
    try {
      const responseText = await response.text();
      console.log(`📥 GET ${resource} response text (primeiros 500 chars):`, responseText.substring(0, 500));
      
      try {
        result = JSON.parse(responseText);
        console.log(`📥 GET ${resource} response parsed:`, result);
      } catch (parseError) {
        console.error(`❌ Erro ao parsear JSON de ${resource}:`, parseError);
        console.error('Response text completo:', responseText);
        return [];
      }
    } catch (jsonError) {
      console.error(`❌ Erro ao ler response de ${resource}:`, jsonError);
      return [];
    }

    if (!result.success) {
      console.error(`❌ API Error para ${resource}:`, result.error);
      console.error(`📋 Dados retornados mesmo com erro:`, result.data);
      // Mesmo com erro, tentar retornar os dados se existirem
      if (result.data && Array.isArray(result.data)) {
        console.log('⚠️ Retornando dados mesmo com success=false');
        return result.data;
      }
      return [];
    }

    const data = result.data || [];
    console.log(`✅ GET ${resource} - ${data.length} itens retornados`);
    if (data.length === 0) {
      console.warn(`⚠️ GET ${resource} retornou array vazio. Verifique se há dados no banco para este tenant.`);
    }
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn(`⏱️ Timeout ao carregar ${resource} (25s). Continuando com dados vazios.`);
    } else {
      console.error(`❌ Error fetching ${resource}:`, error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
    }
    return [];
  }
}

/**
 * Função genérica para fazer requisições POST
 * 
 * Usa Content-Type: text/plain para evitar requisições preflight OPTIONS
 * O Google Apps Script parseia o JSON do body automaticamente
 */
async function post<T>(resource: string, data: T): Promise<T | null> {
  try {
    const url = `${getApiUrl()}/${resource}`;
    
    // Adicionar timeout de 15 segundos (POST pode ser mais lento)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return null;
    }

    const result: ApiResponse<T> = await response.json();

    if (!result.success) {
      console.error('API Error:', result.error);
      return null;
    }

    return result.data || null;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`⏱️ Timeout ao fazer POST em ${resource} (15s)`);
    } else {
      console.error(`Error posting ${resource}:`, error);
    }
    return null;
  }
}

/**
 * Função genérica para fazer requisições PUT
 * 
 * SIMULA PUT via POST com parâmetro method=PUT
 * Usa Content-Type: text/plain para evitar preflight OPTIONS
 */
async function put<T>(resource: string, id: string, data: Partial<T>): Promise<T | null> {
  try {
    const url = `${getApiUrl()}/${resource}/${id}`;
    
    // Adicionar timeout de 15 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return null;
    }

    const result: ApiResponse<T> = await response.json();

    if (!result.success) {
      console.error('API Error:', result.error);
      return null;
    }

    return result.data || null;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`⏱️ Timeout ao fazer PUT em ${resource} (15s)`);
    } else {
      console.error(`Error updating ${resource}:`, error);
    }
    return null;
  }
}

/**
 * Função genérica para fazer requisições DELETE
 * 
 * SIMULA DELETE via GET com parâmetro method=DELETE
 * GET não requer preflight OPTIONS, então funciona perfeitamente
 */
async function del(resource: string, id: string): Promise<boolean> {
  try {
    console.log(`🗑️ Tentando deletar ${resource} com ID: ${id}`);
    
    const url = `${getApiUrl()}/${resource}/${id}`;
    console.log(`📡 URL da requisição DELETE: ${url}`);
    
    // Adicionar timeout de 10 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    const result: ApiResponse<any> = await response.json();
    console.log(`📥 Resposta DELETE:`, result);

    if (!result.success) {
      console.error('❌ API Error:', result.error);
      console.error('📋 Detalhes:', { resource, id, result });
      return false;
    }

    console.log(`✅ ${resource} deletado com sucesso!`);
    return true;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`⏱️ Timeout ao fazer DELETE em ${resource} (10s)`);
    } else {
      console.error(`❌ Error deleting ${resource}:`, error);
      if (error instanceof Error) {
        console.error('Erro detalhado:', error.message, error.stack);
      }
    }
    return false;
  }
}

/**
 * API específica para Players
 */
export const playersApi = {
  getAll: () => get<Player>(API_RESOURCES.players),
  getById: (id: string) => get<Player>(API_RESOURCES.players, id).then(arr => arr[0] || null),
  create: (player: Player) => post<Player>(API_RESOURCES.players, player),
  update: (id: string, player: Partial<Player>) => put<Player>(API_RESOURCES.players, id, player),
  delete: (id: string) => del(API_RESOURCES.players, id),
};

/**
 * API específica para Matches
 */
export const matchesApi = {
  getAll: () => get<MatchRecord>(API_RESOURCES.matches),
  getById: (id: string) => get<MatchRecord>(API_RESOURCES.matches, id).then(arr => arr[0] || null),
  create: (match: MatchRecord) => post<MatchRecord>(API_RESOURCES.matches, match),
  update: (id: string, match: Partial<MatchRecord>) => put<MatchRecord>(API_RESOURCES.matches, id, match),
  delete: (id: string) => del(API_RESOURCES.matches, id),
};

/**
 * API específica para Assessments
 */
export const assessmentsApi = {
  getAll: () => get<PhysicalAssessment>(API_RESOURCES.assessments),
  getById: (id: string) => get<PhysicalAssessment>(API_RESOURCES.assessments, id).then(arr => arr[0] || null),
  create: (assessment: PhysicalAssessment) => post<PhysicalAssessment>(API_RESOURCES.assessments, assessment),
  update: (id: string, assessment: Partial<PhysicalAssessment>) => put<PhysicalAssessment>(API_RESOURCES.assessments, id, assessment),
  delete: (id: string) => del(API_RESOURCES.assessments, id),
};

/**
 * API específica para Schedules
 */
export const schedulesApi = {
  getAll: () => get<WeeklySchedule>(API_RESOURCES.schedules),
  getById: (id: string) => get<WeeklySchedule>(API_RESOURCES.schedules, id).then(arr => arr[0] || null),
  create: (schedule: WeeklySchedule) => post<WeeklySchedule>(API_RESOURCES.schedules, schedule),
  update: (id: string, schedule: Partial<WeeklySchedule>) => put<WeeklySchedule>(API_RESOURCES.schedules, id, schedule),
  delete: (id: string) => del(API_RESOURCES.schedules, id),
};

/**
 * API específica para Competitions (array simples de strings)
 */
export const competitionsApi = {
  getAll: async (): Promise<string[]> => {
    const data = await get<{ name: string }>(API_RESOURCES.competitions);
    return data.map(item => item.name || '').filter(name => name);
  },
  create: async (name: string): Promise<boolean> => {
    const result = await post(API_RESOURCES.competitions, { name });
    return result !== null;
  },
};

/**
 * API específica para Stat Targets
 */
export const statTargetsApi = {
  getAll: () => get<StatTargets>(API_RESOURCES.statTargets),
  getById: (id: string) => get<StatTargets>(API_RESOURCES.statTargets, id).then(arr => arr[0] || null),
  update: (id: string, targets: Partial<StatTargets>) => put<StatTargets>(API_RESOURCES.statTargets, id, targets),
};

/**
 * API específica para Controle de Tempo Jogado
 */
export const timeControlsApi = {
  getAll: () => get<PlayerTimeControl>(API_RESOURCES.timeControls),
  getById: (id: string) => get<PlayerTimeControl>(API_RESOURCES.timeControls, id).then(arr => arr[0] || null),
  create: (timeControl: PlayerTimeControl) => post<PlayerTimeControl>(API_RESOURCES.timeControls, timeControl),
  update: (id: string, timeControl: Partial<PlayerTimeControl>) => put<PlayerTimeControl>(API_RESOURCES.timeControls, id, timeControl),
  delete: (id: string) => del(API_RESOURCES.timeControls, id),
  getByMatchId: async (matchId: string): Promise<PlayerTimeControl[]> => {
    try {
      const url = `${getApiUrl()}/${API_RESOURCES.timeControls}?matchId=${matchId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (!response.ok) {
        console.error('Erro ao buscar time controls:', response.status);
        return [];
      }

      const result: ApiResponse<PlayerTimeControl[]> = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Erro ao buscar time controls:', error);
      return [];
    }
  },
  saveForMatch: async (matchId: string, timeControls: PlayerTimeControl[]): Promise<PlayerTimeControl[]> => {
    try {
      const url = `${getApiUrl()}/${API_RESOURCES.timeControls}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ matchId, timeControls }),
      });

      if (!response.ok) {
        console.error('Erro ao salvar time controls:', response.status);
        return [];
      }

      const result: ApiResponse<PlayerTimeControl[]> = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Erro ao salvar time controls:', error);
      return [];
    }
  },
};

/**
 * API específica para Tabela de Campeonato
 */
export const championshipMatchesApi = {
  getAll: async () => {
    console.log('🔍 championshipMatchesApi.getAll chamado');
    const result = await get<any>(API_RESOURCES.championshipMatches);
    console.log('📥 championshipMatchesApi.getAll resultado:', result);
    console.log('📊 Tipo do resultado:', typeof result, Array.isArray(result));
    console.log('📊 Quantidade de itens:', result?.length || 0);
    if (result && result.length > 0) {
      console.log('📋 Primeiro item:', result[0]);
    }
    return result;
  },
  getById: (id: string) => get<any>(API_RESOURCES.championshipMatches, id).then(arr => arr[0] || null),
  create: (match: any) => post<any>(API_RESOURCES.championshipMatches, match),
  update: (id: string, match: Partial<any>) => put<any>(API_RESOURCES.championshipMatches, id, match),
  delete: (id: string) => del(API_RESOURCES.championshipMatches, id),
};

/**
 * API específica para Teams
 */
export const teamsApi = {
  getAll: () => get<Team>(API_RESOURCES.teams),
  getById: (id: string) => get<Team>(API_RESOURCES.teams, id).then(arr => arr[0] || null),
  create: (team: Omit<Team, 'id' | 'createdAt'>) => post<Team>(API_RESOURCES.teams, team),
  update: (id: string, team: Partial<Team>) => put<Team>(API_RESOURCES.teams, id, team),
  delete: (id: string) => del(API_RESOURCES.teams, id),
};
