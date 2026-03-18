/**
 * Script para criar roles iniciais no banco de dados
 */

import prisma from '../src/config/database';

async function seedRoles() {
  try {
    console.log('🌱 Criando roles iniciais...');
    
    const roles = [
      { name: 'ADMINISTRADOR', description: 'Administrador - Acesso total' },
      { name: 'ESSENCIAL', description: 'Plano Essencial' },
      { name: 'COMPETICAO', description: 'Plano Competicao' },
      { name: 'PERFORMANCE', description: 'Plano Performance' },
    ];

    for (const role of roles) {
      const result = await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      });
      console.log(`✅ Role ${role.name} criada/atualizada (ID: ${result.id})`);
    }

    console.log('✅ Todas as roles foram criadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar roles:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedRoles();

