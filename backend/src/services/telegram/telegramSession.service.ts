import prisma from '../../config/database';

export type SessionPayload = {
  wellness?: Partial<{
    stress: number;
    sono: number;
    humor: number;
    dor: number;
    satisfacao: number;
  }>;
  jogoId?: string;
};

export async function getSession(chatId: string) {
  return prisma.telegramSession.findUnique({ where: { chatId } });
}

export async function setSession(
  chatId: string,
  step: string,
  payload: SessionPayload = {}
): Promise<void> {
  await prisma.telegramSession.upsert({
    where: { chatId },
    create: { chatId, step, payload },
    update: { step, payload },
  });
}

export async function patchSessionPayload(
  chatId: string,
  patch: SessionPayload
): Promise<SessionPayload> {
  const current = await getSession(chatId);
  const prev = (current?.payload as SessionPayload) || {};
  const merged: SessionPayload = {
    ...prev,
    ...patch,
    wellness: { ...prev.wellness, ...patch.wellness },
  };
  await prisma.telegramSession.update({
    where: { chatId },
    data: { payload: merged },
  });
  return merged;
}

export async function clearSession(chatId: string): Promise<void> {
  await prisma.telegramSession.deleteMany({ where: { chatId } });
}
