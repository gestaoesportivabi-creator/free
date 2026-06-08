import prisma from '../config/database';
import { getTenantInfo } from './tenant.helper';
import type { TenantInfo } from './tenant.helper';

export async function loadCoachTenantByChatId(
  chatId: string
): Promise<{ userName: string; email: string; tenantInfo: TenantInfo } | null> {
  const user = await prisma.user.findFirst({
    where: { telegramCoachChatId: chatId.trim(), isActive: true },
    include: { role: true },
  });
  if (!user) return null;

  const tenantInfo = await getTenantInfo(
    { id: user.id, role_id: user.role.name, email: user.email, name: user.name },
    async (userId) => {
      const t = await prisma.tecnico.findUnique({ where: { userId } });
      return t ? { id: t.id, user_id: t.userId, nome: t.nome } : null;
    },
    async (userId) => {
      const c = await prisma.clube.findUnique({ where: { userId } });
      return c ? { id: c.id, user_id: c.userId, razao_social: c.razaoSocial } : null;
    },
    async (tecnicoId) => prisma.equipe.findMany({ where: { tecnicoId }, select: { id: true } }),
    async (clubeId) => prisma.equipe.findMany({ where: { clubeId }, select: { id: true } })
  );

  return { userName: user.name, email: user.email, tenantInfo };
}
