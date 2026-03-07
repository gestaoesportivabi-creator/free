/**
 * Helper para filtros de multi-tenancy
 * Aplicar ajuste recomendado da Seção 11.2.B (item 12)
 */

// Tipos de usuário do sistema
interface User {
  id: string;
  role_id: string;
  email: string;
  name: string;
}

interface Tecnico {
  id: string;
  user_id: string;
  nome: string;
}

interface Clube {
  id: string;
  user_id: string;
  razao_social: string;
}

export interface TenantInfo {
  tecnico_id?: string;
  clube_id?: string;
  equipe_ids?: string[];
}

/**
 * Obtém informações do tenant baseado no usuário
 * Retorna tecnico_id, clube_id ou equipe_ids conforme o role
 */
export async function getTenantInfo(
  user: User,
  getTecnicoByUserId: (userId: string) => Promise<Tecnico | null>,
  getClubeByUserId: (userId: string) => Promise<Clube | null>,
  getEquipesByTecnicoId: (tecnicoId: string) => Promise<{ id: string }[]>,
  getEquipesByClubeId: (clubeId: string) => Promise<{ id: string }[]>
): Promise<TenantInfo> {
  // Buscar técnico associado ao usuário
  const tecnico = await getTecnicoByUserId(user.id);
  if (tecnico) {
    const equipes = await getEquipesByTecnicoId(tecnico.id);
    return {
      tecnico_id: tecnico.id,
      equipe_ids: equipes.map((e) => e.id),
    };
  }

  // Buscar clube associado ao usuário
  const clube = await getClubeByUserId(user.id);
  if (clube) {
    const equipes = await getEquipesByClubeId(clube.id);
    return {
      clube_id: clube.id,
      equipe_ids: equipes.map((e) => e.id),
    };
  }

  // Se não encontrou técnico nem clube, retornar vazio (usuário sem tenant)
  return {};
}

/**
 * Gera filtro SQL WHERE para queries de equipes baseado no tenant
 */
export function getEquipesTenantFilter(tenantInfo: TenantInfo): {
  where: string;
  params: any[];
} {
  if (tenantInfo.equipe_ids && tenantInfo.equipe_ids.length > 0) {
    return {
      where: 'equipe_id = ANY($1)',
      params: [tenantInfo.equipe_ids],
    };
  }

  if (tenantInfo.tecnico_id) {
    return {
      where: 'equipe_id IN (SELECT id FROM equipes WHERE tecnico_id = $1)',
      params: [tenantInfo.tecnico_id],
    };
  }

  if (tenantInfo.clube_id) {
    return {
      where: 'equipe_id IN (SELECT id FROM equipes WHERE clube_id = $1)',
      params: [tenantInfo.clube_id],
    };
  }

  // Sem tenant - retornar filtro vazio (deve ser tratado como erro)
  return {
    where: '1 = 0', // Sempre falso - não retorna nada
    params: [],
  };
}

/**
 * Gera filtro SQL WHERE para queries diretas de equipes
 */
export function getEquipesDirectFilter(tenantInfo: TenantInfo): {
  where: string;
  params: any[];
} {
  if (tenantInfo.tecnico_id) {
    return {
      where: 'tecnico_id = $1',
      params: [tenantInfo.tecnico_id],
    };
  }

  if (tenantInfo.clube_id) {
    return {
      where: 'clube_id = $1',
      params: [tenantInfo.clube_id],
    };
  }

  // Sem tenant - retornar filtro vazio
  return {
    where: '1 = 0',
    params: [],
  };
}

/**
 * Valida se o tenant tem acesso a uma equipe específica
 */
export function hasAccessToEquipe(tenantInfo: TenantInfo, equipeId: string): boolean {
  if (tenantInfo.equipe_ids) {
    return tenantInfo.equipe_ids.includes(equipeId);
  }
  return false;
}

/**
 * Valida se o tenant tem acesso a um jogo específico (via equipe)
 */
export async function hasAccessToJogo(
  tenantInfo: TenantInfo,
  jogoEquipeId: string,
  getEquipeIdByJogoId: (jogoId: string) => Promise<string | null>
): Promise<boolean> {
  if (!tenantInfo.equipe_ids || tenantInfo.equipe_ids.length === 0) {
    return false;
  }

  const equipeId = await getEquipeIdByJogoId(jogoEquipeId);
  if (!equipeId) {
    return false;
  }

  return tenantInfo.equipe_ids.includes(equipeId);
}

