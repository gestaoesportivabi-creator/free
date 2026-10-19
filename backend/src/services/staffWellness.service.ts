/**
 * Regras de wellness da comissão (sem Prisma).
 * O GET/POST /api/wellness/:type usa estas funções antes de tocar o banco.
 */

import { Prisma } from '@prisma/client';
import { AppError, ConflictError, ValidationError } from '../utils/errors';

export const STAFF_WELLNESS_TYPES = [
  'pse-treino',
  'pse-jogo',
  'psr-treino',
  'psr-jogo',
  'qualidade-sono',
  'bem-estar-diario',
] as const;

export type StaffWellnessType = (typeof STAFF_WELLNESS_TYPES)[number];

export type TeamScope =
  | { mode: 'none' }
  | { mode: 'unrestricted' }
  | { mode: 'restricted'; equipeIds: string[] };

const INPUT_PRISMA_CODES = new Set([
  'P2000',
  'P2003',
  'P2005',
  'P2006',
  'P2007',
  'P2011',
  'P2012',
  'P2013',
  'P2019',
  'P2020',
]);

export function assertStaffWellnessType(type: unknown): StaffWellnessType {
  if (typeof type !== 'string' || !(STAFF_WELLNESS_TYPES as readonly string[]).includes(type)) {
    throw new ValidationError('Tipo de wellness inválido.');
  }
  return type as StaffWellnessType;
}

/**
 * Técnico sem equipes não pode virar `IN ()`.
 * Admin sem equipes mantém a listagem sem filtro (acesso total já existente).
 * Admin com equipes continua restrito a essas equipes.
 */
export function resolveTeamScope(isAdmin: boolean, equipeIds: readonly unknown[] | undefined): TeamScope {
  const ids = (equipeIds ?? []).filter((id): id is string => typeof id === 'string' && id.length > 0);
  if (ids.length === 0) {
    return isAdmin ? { mode: 'unrestricted' } : { mode: 'none' };
  }
  return { mode: 'restricted', equipeIds: ids };
}

export function bemEstarListWhere(scope: TeamScope): { equipe_id: { in: string[] } } | undefined {
  if (scope.mode === 'none') {
    throw new Error('Listagem sem equipes não consulta o banco');
  }
  if (scope.mode === 'unrestricted') return undefined;
  if (scope.equipeIds.length === 0) {
    throw new Error('Filtro de equipes vazio');
  }
  return { equipe_id: { in: scope.equipeIds } };
}

/** Data de calendário ao meio-dia UTC, para a coluna DATE não mudar de dia no fuso. */
export function parseBemEstarDate(raw: unknown): Date {
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) throw new ValidationError('Data inválida.');
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) throw new ValidationError('Data inválida.');
    return dt;
  }
  if (typeof raw !== 'string') throw new ValidationError('Data inválida.');
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(raw.trim());
  if (!match) throw new ValidationError('Data inválida.');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dt = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    throw new ValidationError('Data inválida.');
  }
  return dt;
}

export function clampBemEstarScore(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new ValidationError('Escala de bem-estar inválida.');
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) throw new ValidationError('Escala de bem-estar inválida.');
  if (n < 1 || n > 5) return null;
  return Math.round(n);
}

export function parseObservacoes(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new ValidationError('Observações inválidas.');
  return value;
}

export type PreparedBemEstar = {
  jogadorId: string;
  equipeId: string;
  data: Date;
  payload: {
    nivel_stress: number | null;
    qual_sono: number | null;
    humor_mot: number | null;
    dor_muscular: number | null;
    satisfacao: number | null;
    observacoes: string | null;
  };
};

/** `null` = linha incompleta ou equipe fora do tenant (não grava, não é erro de formato). */
export function prepareBemEstarItem(item: unknown, scope: TeamScope): PreparedBemEstar | null {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new ValidationError('Item de bem-estar inválido.');
  }
  const row = item as Record<string, unknown>;
  const jogadorId = typeof row.jogadorId === 'string' ? row.jogadorId : '';
  const equipeId = typeof row.equipeId === 'string' ? row.equipeId : '';
  const hasData = row.data !== undefined && row.data !== null && row.data !== '';
  if (!jogadorId || !equipeId || !hasData) return null;
  if (scope.mode === 'none') return null;
  if (scope.mode === 'restricted' && !scope.equipeIds.includes(equipeId)) return null;

  return {
    jogadorId,
    equipeId,
    data: parseBemEstarDate(row.data),
    payload: {
      nivel_stress: clampBemEstarScore(row.nivel_stress),
      qual_sono: clampBemEstarScore(row.qual_sono),
      humor_mot: clampBemEstarScore(row.humor_mot),
      dor_muscular: clampBemEstarScore(row.dor_muscular),
      satisfacao: clampBemEstarScore(row.satisfacao),
      observacoes: parseObservacoes(row.observacoes),
    },
  };
}

export function assertBemEstarRowInScope(
  existingEquipeId: string,
  isAdmin: boolean,
  scope: TeamScope
): void {
  if (isAdmin || scope.mode === 'unrestricted') return;
  if (scope.mode === 'restricted' && scope.equipeIds.includes(existingEquipeId)) return;
  throw new ConflictError('Já existe bem-estar deste atleta nesta data fora das suas equipes.');
}

export function parseWellnessScore(value: unknown): number | null {
  if (value === undefined) return null;
  if (value === null || value === '') return null;
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(n)) throw new ValidationError('Valor inválido.');
  return n;
}

/**
 * Erro de entrada ou constraint de dado vira 4xx.
 * P2028 (transação/pgbouncer) e falha de schema continuam 500: esta rota não abre transação.
 */
export function wellnessFailure(error: unknown, fallback: string): { status: number; error: string } {
  if (error instanceof AppError) {
    return { status: error.statusCode, error: error.message };
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    return { status: 400, error: 'Dados de wellness inválidos.' };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return { status: 409, error: 'Já existe registro para este atleta nesta data.' };
    }
    if (error.code === 'P2025') {
      return { status: 404, error: 'Registro não encontrado.' };
    }
    if (INPUT_PRISMA_CODES.has(error.code)) {
      return { status: 400, error: 'Dados de wellness inválidos.' };
    }
  }
  return { status: 500, error: fallback };
}
