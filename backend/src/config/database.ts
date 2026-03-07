/**
 * Configuração do Prisma Client
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;

// Helper para desconectar ao encerrar aplicação
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

