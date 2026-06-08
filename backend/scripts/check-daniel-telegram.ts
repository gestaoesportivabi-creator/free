import prisma from '../src/config/database';

async function main() {
  const u = await prisma.user.findUnique({
    where: { id: '0b1b468f-274f-49e7-8624-2dbe4670eea5' },
    select: {
      name: true,
      email: true,
      telegramCoachChatId: true,
      telegramChatId: true,
      updatedAt: true,
    },
  });
  console.log('Daniel user:', JSON.stringify(u, null, 2));

  const linked = await prisma.user.findMany({
    where: { telegramCoachChatId: { not: null } },
    select: { name: true, email: true, telegramCoachChatId: true, updatedAt: true },
  });
  console.log('All coach telegram links:', JSON.stringify(linked, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
