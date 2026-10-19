/**
 * Acesso a `bem_estar_diario`. Não usa `runWithTenant`: a rota filtra `equipe_id`
 * no próprio where. Abrir transação interativa aqui só adicionaria P2028 no pgbouncer.
 */

import prisma from '../config/database';

export type BemEstarDiarioRepository = {
  findMany(args: {
    where?: { equipe_id: { in: string[] } };
    orderBy: { created_at: 'desc' };
  }): Promise<unknown[]>;
  findFirst(args: {
    where: { jogador_id: string; data: Date };
  }): Promise<{ id: string; equipe_id: string } | null>;
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
  create(args: { data: Record<string, unknown> }): Promise<unknown>;
};

export const bemEstarDiarioRepository: BemEstarDiarioRepository = {
  findMany: (args) => prisma.bem_estar_diario.findMany(args),
  findFirst: (args) => prisma.bem_estar_diario.findFirst(args),
  update: (args) => prisma.bem_estar_diario.update(args as never),
  create: (args) => prisma.bem_estar_diario.create(args as never),
};
