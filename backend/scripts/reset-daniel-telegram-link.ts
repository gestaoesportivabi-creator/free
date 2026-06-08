/**
 * Remove vínculo Telegram incorreto do Daniel (estava apontando para chat de teste).
 * Web assistant não usa telegramCoachChatId.
 *
 * Uso: npx tsx scripts/reset-daniel-telegram-link.ts
 */

import prisma from '../src/config/database';

const DANIEL_USER_ID = '0b1b468f-274f-49e7-8624-2dbe4670eea5';

async function main() {
  const before = await prisma.user.findUnique({
    where: { id: DANIEL_USER_ID },
    select: { id: true, name: true, email: true, telegramCoachChatId: true },
  });

  if (!before) {
    console.error('Usuário Daniel não encontrado:', DANIEL_USER_ID);
    process.exit(1);
  }

  console.log('Antes:', before);

  if (!before.telegramCoachChatId) {
    console.log('telegramCoachChatId já está vazio — nada a fazer.');
    return;
  }

  const after = await prisma.user.update({
    where: { id: DANIEL_USER_ID },
    data: { telegramCoachChatId: null },
    select: { id: true, name: true, email: true, telegramCoachChatId: true },
  });

  console.log('Depois:', after);
  console.log('✅ Vínculo Telegram removido com sucesso.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
