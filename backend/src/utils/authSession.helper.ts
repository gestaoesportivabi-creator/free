import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { env } from '../config/env';
import { getAthleteEquipeId } from './athleteAccount.helper';

import { resolveSessionPlanName } from './subscription.helper';

function mapRoleForFrontend(roleName: string): string {
  if (roleName === 'ATLETA') return 'ATLETA';
  const MAP: Record<string, string> = {
    ADMINISTRADOR: 'TECNICO',
    ESSENCIAL: 'TECNICO',
    COMPETICAO: 'TECNICO',
    PERFORMANCE: 'TECNICO',
  };
  return MAP[roleName] ?? roleName;
}

export async function buildAuthSessionForUser(userId: string): Promise<{
  token: string;
  user: Record<string, unknown>;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      jogadorId: true,
      role: { select: { name: true } },
    },
  });

  if (!user || !user.isActive) {
    throw new Error('USER_INACTIVE');
  }

  const roleName = user.role.name;
  const isAthlete = roleName === 'ATLETA' && !!user.jogadorId;
  const equipeId =
    isAthlete && user.jogadorId ? await getAthleteEquipeId(user.jogadorId) : null;

  await prisma.user
    .update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })
    .catch(() => undefined);

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      userType: isAthlete ? 'athlete' : 'staff',
      jogadorId: user.jogadorId ?? undefined,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: mapRoleForFrontend(roleName),
      planName: await resolveSessionPlanName(prisma, user.id, roleName, isAthlete),
      isPlatformAdmin: roleName === 'ADMINISTRADOR',
      ...(isAthlete && user.jogadorId
        ? {
            jogadorId: user.jogadorId,
            linkedPlayerId: user.jogadorId,
            equipeId,
          }
        : {}),
    },
  };
}
