/**
 * Script para criar o usuário admin inicial no banco de dados
 * Necessário quando o banco é novo ou foi resetado.
 *
 * Uso: npm run seed:admin
 *
 * Credenciais criadas:
 * - Email: admin@admin.com
 * - Senha: admin
 */

import bcrypt from 'bcrypt';
import prisma from '../src/config/database';

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'admin';
const ADMIN_NAME = 'Administrador';

async function main() {
  console.log('🌱 Criando usuário admin inicial...\n');

  // 1. Garantir que as roles existem
  const roles = [
    { name: 'ADMIN', description: 'Administrador do sistema' },
    { name: 'TECNICO', description: 'Técnico/Treinador' },
    { name: 'CLUBE', description: 'Clube' },
    { name: 'ATLETA', description: 'Atleta' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log('✓ Roles verificadas/criadas');

  // 2. Buscar role TECNICO (admin usa TECNICO para ter acesso ao sistema)
  const roleTecnico = await prisma.role.findUnique({
    where: { name: 'TECNICO' },
  });

  if (!roleTecnico) {
    throw new Error('Role TECNICO não encontrada');
  }

  // 3. Criar ou atualizar usuário admin
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash,
      name: ADMIN_NAME,
      isActive: true,
    },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      name: ADMIN_NAME,
      roleId: roleTecnico.id,
    },
    include: { tecnico: true },
  });

  // 4. Criar registro Tecnico se não existir (necessário para o seed:demo e uso do sistema)
  if (!user.tecnico) {
    await prisma.tecnico.create({
      data: {
        userId: user.id,
        nome: user.name,
      },
    });
    console.log('✓ Registro de técnico criado para o admin');
  } else {
    console.log('✓ Admin já possui registro de técnico');
  }

  console.log('\n✅ Usuário admin criado/atualizado com sucesso!');
  console.log('\n📋 Credenciais de login:');
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Senha: ${ADMIN_PASSWORD}`);
  console.log('\n💡 Dica: Use "admin" ou "admin@admin.com" como email na tela de login.\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
