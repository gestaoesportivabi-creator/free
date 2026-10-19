/**
 * Jogador pertence ao tenant quando tem vínculo com alguma equipe de equipe_ids.
 */

import prisma from '../config/database';

export type JogadorTenantDb = {
  jogador: {
    findMany(args: {
      where: {
        id: { in: string[] };
        equipes: { some: { equipeId: { in: string[] } } };
      };
      select: { id: true };
    }): Promise<Array<{ id: string }>>;
  };
};

export function equipeInTenant(equipeId: unknown, equipeIds: readonly string[] | undefined): boolean {
  return typeof equipeId === 'string' && equipeId.length > 0 && (equipeIds ?? []).includes(equipeId);
}

export async function jogadorIdsInTenant(
  jogadorIds: readonly string[],
  equipeIds: readonly string[],
  db: JogadorTenantDb = prisma
): Promise<Set<string>> {
  const ids = [...new Set(jogadorIds.filter((id) => id.length > 0))];
  const teams = [...new Set(equipeIds.filter((id) => id.length > 0))];
  if (ids.length === 0 || teams.length === 0) return new Set();

  const rows = await db.jogador.findMany({
    where: {
      id: { in: ids },
      equipes: { some: { equipeId: { in: teams } } },
    },
    select: { id: true },
  });
  return new Set(rows.map((row) => row.id));
}
