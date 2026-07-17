import bcrypt from 'bcrypt';
import '../src/config/env';
import prisma, { disconnectDatabase } from '../src/config/database';
import { QA_ENVIRONMENT, normalizeEmail } from './helpers/qa-environment';

type QaUserRecord = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  passwordHash: string;
  role: {
    name: string;
  };
};

function requireQaCredentials(): { email: string; password: string } {
  const email = normalizeEmail(process.env.QA_USER_EMAIL ?? '');
  const password = process.env.QA_USER_PASSWORD ?? '';

  if (!email) {
    throw new Error('QA_USER_EMAIL não configurado.');
  }
  if (!password) {
    throw new Error('QA_USER_PASSWORD não configurado.');
  }
  if (email !== normalizeEmail(QA_ENVIRONMENT.userEmail)) {
    throw new Error('QA_USER_EMAIL não corresponde ao usuário QA oficial.');
  }
  if (password.trim().length < 10) {
    throw new Error('QA_USER_PASSWORD precisa ter ao menos 10 caracteres.');
  }

  return { email, password };
}

async function loadQaUser(email: string): Promise<QaUserRecord> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      passwordHash: true,
      role: { select: { name: true } },
    },
  });

  if (!user) {
    throw new Error('Usuário QA não encontrado.');
  }
  if (user.name !== QA_ENVIRONMENT.tenantName) {
    throw new Error('Conflito de segurança: o usuário encontrado não pertence ao tenant QA esperado.');
  }
  if (user.role.name !== QA_ENVIRONMENT.userRole) {
    throw new Error('Conflito de segurança: role do usuário QA não corresponde ao ambiente oficial.');
  }
  if (!user.isActive) {
    throw new Error('Usuário QA está inativo.');
  }

  return user;
}

async function validateQaStructure(userId: string): Promise<void> {
  const tecnico = await prisma.tecnico.findUnique({
    where: { userId },
    select: { id: true, nome: true },
  });
  if (!tecnico || tecnico.nome !== QA_ENVIRONMENT.tenantName) {
    throw new Error('Conflito de segurança: técnico QA não encontrado ou divergente.');
  }

  const clube = await prisma.clube.findUnique({
    where: { userId },
    select: { id: true, razaoSocial: true },
  });
  if (!clube || clube.razaoSocial !== QA_ENVIRONMENT.clubName) {
    throw new Error('Conflito de segurança: clube QA não encontrado ou divergente.');
  }

  const equipe = await prisma.equipe.findFirst({
    where: {
      tecnicoId: tecnico.id,
      clubeId: clube.id,
      nome: QA_ENVIRONMENT.teamName,
    },
    select: { id: true },
  });
  if (!equipe) {
    throw new Error('Conflito de segurança: equipe QA não encontrada.');
  }
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const { email, password } = requireQaCredentials();
  const user = await loadQaUser(email);

  await validateQaStructure(user.id);

  const alreadySynchronized = await bcrypt.compare(password, user.passwordHash);
  if (alreadySynchronized) {
    console.log('Credencial QA já estava padronizada. Nenhuma alteração foi necessária.');
    console.log(`Usuário QA validado: ${user.email}`);
    return;
  }

  if (dryRun) {
    console.log('Dry-run: credencial QA validada e pronta para atualização segura.');
    console.log(`Usuário QA validado: ${user.email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  console.log('Senha da conta QA redefinida com segurança.');
  console.log(`Usuário QA validado: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
