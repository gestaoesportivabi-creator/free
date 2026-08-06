/**
 * Backfill de assinaturas para contas criadas antes do teste gratuito.
 *
 * Toda conta existente recebe `status = active` com o plano igual ao Role atual.
 * Isto é deliberado: quem já usa o sistema não pode acordar dentro de um trial
 * com data de validade. `resolveEffectiveAccess()` também trata `subscription = null`
 * como acesso liberado, então este script é uma rede de segurança, não um requisito
 * de funcionamento.
 *
 * Idempotente: só cria o que falta. Pode rodar quantas vezes for preciso.
 *
 * Uso: npm run backfill:subscriptions
 */

import prisma from '../src/config/database';

const PLAN_ROLES = new Set(['ESSENCIAL', 'COMPETICAO', 'PERFORMANCE', 'ADMINISTRADOR']);

async function backfillSubscriptions() {
  console.log('🔄 Backfill de assinaturas para contas existentes...\n');

  const users = await prisma.user.findMany({
    where: { subscription: null },
    select: {
      id: true,
      email: true,
      role: { select: { name: true } },
    },
  });

  if (users.length === 0) {
    console.log('✅ Nenhuma conta sem assinatura. Nada a fazer.');
    return;
  }

  console.log(`Encontradas ${users.length} conta(s) sem assinatura.\n`);

  let created = 0;
  let skipped = 0;

  for (const user of users) {
    const roleName = user.role?.name ?? 'ESSENCIAL';

    // Atletas não têm assinatura própria — o acesso deles depende do técnico.
    if (!PLAN_ROLES.has(roleName)) {
      console.log(`  ⏭️  ${user.email} (role ${roleName}) — sem assinatura por design`);
      skipped += 1;
      continue;
    }

    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: roleName,
        status: 'active',
        // Sem trial: são contas legadas, não entraram por auto-cadastro.
        trialStartedAt: null,
        trialEndsAt: null,
      },
    });

    console.log(`  ✅ ${user.email} → ${roleName} (active)`);
    created += 1;
  }

  console.log(`\n✅ Backfill concluído: ${created} criada(s), ${skipped} ignorada(s).`);
}

backfillSubscriptions()
  .catch((error) => {
    console.error('❌ Erro no backfill:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
