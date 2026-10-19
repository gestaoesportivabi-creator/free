import { ConflictError } from '../utils/errors';

/**
 * Camisa repetida na mesma equipe do tenant.
 * A consulta nunca abre mão do equipeId: número igual em outro clube não conta.
 */

export interface JerseyCandidate {
  id: string;
  nome: string;
  numeroCamisa: number | null;
  isAtivo: boolean;
  isTransferido: boolean;
  equipeId: string;
  dataFim: Date | string | null;
}

export interface ActiveJerseyWhere {
  numeroCamisa: number;
  isAtivo: true;
  isTransferido: false;
  id?: { not: string };
  equipes: {
    some: {
      equipeId: string;
      dataFim: null;
    };
  };
}

export type JerseyLookup =
  | { refused: true; reason: 'outside_tenant' }
  | { refused: false; equipeId: string; where: ActiveJerseyWhere };

export function jerseyConflictMessage(numero: number, nome: string): string {
  const who = nome.trim() || 'outro atleta';
  return `Número ${numero} já está em uso por ${who} nesta equipe.`;
}

export function jerseyConflictError(numero: number, nome: string): ConflictError {
  return new ConflictError(jerseyConflictMessage(numero, nome), 'JERSEY_IN_USE');
}

/**
 * Monta o filtro do Prisma. Se a equipe não é do tenant, recusa sem consultar.
 */
export function activeJerseyLookup(input: {
  equipeId: string;
  numeroCamisa: number;
  tenantEquipeIds: readonly string[];
  excludePlayerId?: string;
}): JerseyLookup {
  if (!input.equipeId || !input.tenantEquipeIds.includes(input.equipeId)) {
    return { refused: true, reason: 'outside_tenant' };
  }
  return {
    refused: false,
    equipeId: input.equipeId,
    where: {
      numeroCamisa: input.numeroCamisa,
      isAtivo: true,
      isTransferido: false,
      ...(input.excludePlayerId ? { id: { not: input.excludePlayerId } } : {}),
      equipes: {
        some: {
          equipeId: input.equipeId,
          dataFim: null,
        },
      },
    },
  };
}

/** Mesma regra do filtro, em memória — usada nos testes e como especificação. */
export function findActiveJerseyConflict(input: {
  equipeId: string;
  numeroCamisa: number | null | undefined;
  tenantEquipeIds: readonly string[];
  candidates: readonly JerseyCandidate[];
  excludePlayerId?: string;
}): { id: string; nome: string } | null {
  if (typeof input.numeroCamisa !== 'number' || !Number.isFinite(input.numeroCamisa)) return null;
  const lookup = activeJerseyLookup({
    equipeId: input.equipeId,
    numeroCamisa: input.numeroCamisa,
    tenantEquipeIds: input.tenantEquipeIds,
    excludePlayerId: input.excludePlayerId,
  });
  if (lookup.refused) return null;

  const hit = input.candidates.find((candidate) => matchesActiveJersey(candidate, lookup.where));
  return hit ? { id: hit.id, nome: hit.nome } : null;
}

export function matchesActiveJersey(candidate: JerseyCandidate, where: ActiveJerseyWhere): boolean {
  if (candidate.numeroCamisa !== where.numeroCamisa) return false;
  if (!candidate.isAtivo || candidate.isTransferido) return false;
  if (candidate.dataFim != null) return false;
  if (candidate.equipeId !== where.equipes.some.equipeId) return false;
  if (where.id && candidate.id === where.id.not) return false;
  return true;
}
