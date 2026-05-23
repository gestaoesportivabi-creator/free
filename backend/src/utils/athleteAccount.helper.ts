/**
 * Helpers para conta de acesso do atleta (User + Jogador)
 */

import bcrypt from 'bcrypt';
import prisma from '../config/database';
import type { TransactionClient } from './transactionWithTenant';
import { AppError, ValidationError } from './errors';

const MIN_PASSWORD_LENGTH = 8;

export function validateAccessPassword(password: string): void {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(`Senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres`);
  }
}

export function normalizeAccessEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getAtletaRoleId(tx?: TransactionClient): Promise<string> {
  const client = tx ?? prisma;
  const role = await client.role.findUnique({ where: { name: 'ATLETA' } });
  if (!role) {
    throw new AppError('Role ATLETA não configurada. Execute a migration 021.', 500);
  }
  return role.id;
}

export async function createAthleteUserAccount(
  params: {
    jogadorId: string;
    name: string;
    accessEmail: string;
    accessPassword: string;
  },
  tx?: TransactionClient
): Promise<void> {
  const client = tx ?? prisma;
  const email = normalizeAccessEmail(params.accessEmail);
  validateAccessPassword(params.accessPassword);

  const existing = await client.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw new AppError('Email de acesso já cadastrado no sistema', 409);
  }

  const linked = await client.user.findUnique({
    where: { jogadorId: params.jogadorId },
    select: { id: true },
  });
  if (linked) {
    throw new AppError('Este atleta já possui conta de acesso', 409);
  }

  const passwordHash = await bcrypt.hash(params.accessPassword, 10);
  const roleId = await getAtletaRoleId(tx);

  await client.user.create({
    data: {
      email,
      passwordHash,
      name: params.name.trim(),
      roleId,
      jogadorId: params.jogadorId,
      isActive: true,
    },
  });
}

export async function updateAthleteUserAccount(
  jogadorId: string,
  params: {
    accessEmail?: string;
    accessPassword?: string;
    revokeAccess?: boolean;
    createAccess?: boolean;
    name?: string;
    isTransferido?: boolean;
  },
  tx?: TransactionClient
): Promise<void> {
  const client = tx ?? prisma;
  const existingUser = await client.user.findUnique({
    where: { jogadorId },
    select: { id: true, email: true, isActive: true },
  });

  const shouldRevoke =
    params.revokeAccess === true ||
    params.isTransferido === true;

  if (params.createAccess === true && !existingUser) {
    if (!params.accessEmail || !params.accessPassword) {
      throw new ValidationError('Email e senha são obrigatórios para criar acesso do atleta');
    }
    await createAthleteUserAccount(
      {
        jogadorId,
        name: params.name || 'Atleta',
        accessEmail: params.accessEmail,
        accessPassword: params.accessPassword,
      },
      tx
    );
    return;
  }

  if (!existingUser) return;

  const updateData: {
    email?: string;
    passwordHash?: string;
    isActive?: boolean;
    name?: string;
  } = {};

  if (params.name) updateData.name = params.name.trim();

  if (params.accessEmail) {
    const email = normalizeAccessEmail(params.accessEmail);
    if (email !== existingUser.email) {
      const dup = await client.user.findFirst({
        where: { email, NOT: { id: existingUser.id } },
        select: { id: true },
      });
      if (dup) throw new AppError('Email de acesso já cadastrado no sistema', 409);
      updateData.email = email;
    }
  }

  if (params.accessPassword) {
    validateAccessPassword(params.accessPassword);
    updateData.passwordHash = await bcrypt.hash(params.accessPassword, 10);
  }

  if (shouldRevoke) {
    updateData.isActive = false;
  } else if (params.revokeAccess === false) {
    updateData.isActive = true;
  }

  if (Object.keys(updateData).length > 0) {
    await client.user.update({
      where: { id: existingUser.id },
      data: updateData,
    });
  }
}

export async function getAthleteEquipeId(jogadorId: string): Promise<string | null> {
  const link = await prisma.equipesJogadores.findFirst({
    where: { jogadorId, dataFim: null },
    orderBy: { dataInicio: 'desc' },
    select: { equipeId: true },
  });
  return link?.equipeId ?? null;
}

export async function getAthleteEquipeIds(jogadorId: string): Promise<string[]> {
  const links = await prisma.equipesJogadores.findMany({
    where: { jogadorId, dataFim: null },
    select: { equipeId: true },
  });
  return links.map((l) => l.equipeId);
}
