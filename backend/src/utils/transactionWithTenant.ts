/**
 * Runs request logic inside a Prisma transaction and sets RLS session variables
 * so Row Level Security policies apply with the current tenant context.
 */

import { Request } from 'express';
import prisma from '../config/database';

export type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Executes fn inside a transaction after setting app.equipe_ids, app.tecnico_id, app.clube_id.
 * Use this for all tenant-scoped routes so RLS policies filter correctly.
 */
export async function runWithTenant<T>(
  req: Request,
  fn: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  const tenantInfo = req.tenantInfo;
  if (!tenantInfo) {
    throw new Error('tenantInfo not set; ensure tenant middleware runs after auth');
  }

  return prisma.$transaction(async (tx) => {
    const equipeIdsStr = tenantInfo.equipe_ids?.join(',') ?? '';
    await tx.$executeRawUnsafe("SELECT set_config('app.equipe_ids', $1, true)", equipeIdsStr);
    await tx.$executeRawUnsafe("SELECT set_config('app.tecnico_id', $1, true)", tenantInfo.tecnico_id ?? '');
    await tx.$executeRawUnsafe("SELECT set_config('app.clube_id', $1, true)", tenantInfo.clube_id ?? '');
    return fn(tx);
  });
}
