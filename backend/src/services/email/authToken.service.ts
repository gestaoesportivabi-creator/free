import crypto from 'crypto';
import { EmailAuthPurpose } from '@prisma/client';
import prisma from '../../config/database';

const TTL_MINUTES: Record<EmailAuthPurpose, number> = {
  password_reset: 60,
  magic_link: 15,
  email_verify: 24 * 60,
};

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function buildFrontendAuthUrl(path: string, token: string): string {
  const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}${path}?token=${encodeURIComponent(token)}`;
}

export async function createEmailAuthToken(
  userId: string,
  purpose: EmailAuthPurpose
): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TTL_MINUTES[purpose] * 60 * 1000);

  await prisma.$transaction([
    prisma.emailAuthToken.updateMany({
      where: { userId, purpose, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.emailAuthToken.create({
      data: {
        userId,
        tokenHash,
        purpose,
        expiresAt,
      },
    }),
  ]);

  return { rawToken, expiresAt };
}

export async function consumeEmailAuthToken(
  rawToken: string,
  purpose: EmailAuthPurpose
): Promise<{ userId: string } | null> {
  const tokenHash = hashToken(rawToken.trim());
  const now = new Date();

  const record = await prisma.emailAuthToken.findFirst({
    where: {
      tokenHash,
      purpose,
      usedAt: null,
      expiresAt: { gt: now },
    },
    select: { id: true, userId: true },
  });

  if (!record) return null;

  await prisma.emailAuthToken.update({
    where: { id: record.id },
    data: { usedAt: now },
  });

  return { userId: record.userId };
}

export function getTokenTtlMinutes(purpose: EmailAuthPurpose): number {
  return TTL_MINUTES[purpose];
}

export function getTokenTtlHours(purpose: EmailAuthPurpose): number {
  return TTL_MINUTES[purpose] / 60;
}
