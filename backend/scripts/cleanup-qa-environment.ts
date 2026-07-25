import prisma from '../src/config/database';
import {
  QA_CLEANUP_CONFIRMATION,
  QA_CLEANUP_GUARD,
  QA_ENVIRONMENT,
  isDryRun,
  listQaMatches,
  normalizeEmail,
  qaMatchDate,
} from './helpers/qa-environment';

type CleanupCounts = {
  campeonatoJogo: number;
  estatisticasEquipe: number;
  estatisticasJogador: number;
  eventos: number;
  jogo: number;
  campeonato: number;
  competicao: number;
  vinculosJogadores: number;
  jogadores: number;
  equipe: number;
  clube: number;
  tecnico: number;
  user: number;
};

const EMPTY_COUNTS: CleanupCounts = {
  campeonatoJogo: 0,
  estatisticasEquipe: 0,
  estatisticasJogador: 0,
  eventos: 0,
  jogo: 0,
  campeonato: 0,
  competicao: 0,
  vinculosJogadores: 0,
  jogadores: 0,
  equipe: 0,
  clube: 0,
  tecnico: 0,
  user: 0,
};

const QA_MATCHES = listQaMatches();

function sumCleanup(counts: CleanupCounts): number {
  return Object.values(counts).reduce((total, value) => total + value, 0);
}

function printCounts(title: string, counts: CleanupCounts): void {
  console.log(`\n${title}`);
  (Object.keys(counts) as Array<keyof CleanupCounts>).forEach((key) => {
    console.log(`- ${key}: ${counts[key]}`);
  });
  console.log(`- total: ${sumCleanup(counts)}`);
}

async function loadCleanupTargets() {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(QA_ENVIRONMENT.userEmail) },
    select: { id: true, name: true },
  });
  if (user && user.name !== QA_ENVIRONMENT.tenantName) {
    throw new Error('Conflito de seguranca: email QA aponta para um usuario nao esperado.');
  }

  const tecnico = user
    ? await prisma.tecnico.findUnique({
        where: { userId: user.id },
        select: { id: true, nome: true },
      })
    : null;
  if (tecnico && tecnico.nome !== QA_ENVIRONMENT.tenantName) {
    throw new Error('Conflito de seguranca: tecnico vinculado ao usuario QA nao e o tenant esperado.');
  }

  const clube = user
    ? await prisma.clube.findUnique({
        where: { userId: user.id },
        select: { id: true, razaoSocial: true },
      })
    : null;
  if (clube && clube.razaoSocial !== QA_ENVIRONMENT.clubName) {
    throw new Error('Conflito de seguranca: clube vinculado ao usuario QA nao e o clube esperado.');
  }

  const equipe = tecnico
    ? await prisma.equipe.findFirst({
        where: { tecnicoId: tecnico.id, nome: QA_ENVIRONMENT.teamName },
        select: { id: true, nome: true },
      })
    : null;

  const jogadores = equipe
    ? await prisma.jogador.findMany({
        where: {
          nome: { in: [...QA_ENVIRONMENT.playerNames] },
          equipes: {
            some: {
              equipeId: equipe.id,
              dataFim: null,
            },
          },
        },
        select: { id: true, nome: true },
      })
    : [];

  const vinculosJogadores =
    equipe && jogadores.length > 0
      ? await prisma.equipesJogadores.findMany({
          where: {
            equipeId: equipe.id,
            jogadorId: { in: jogadores.map((player) => player.id) },
            dataFim: null,
          },
          select: { id: true, jogadorId: true },
        })
      : [];

  const competicoes = await prisma.competicao.findMany({
    where: {
      nome: { in: QA_MATCHES.map((matchDefinition) => matchDefinition.competitionName) },
    },
    select: { id: true, nome: true },
  });

  const campeonatos = equipe
    ? await prisma.campeonato.findMany({
        where: {
          equipeId: equipe.id,
          nome: { in: QA_MATCHES.map((matchDefinition) => matchDefinition.competitionName) },
        },
        select: { id: true, nome: true },
      })
    : [];

  const jogos = equipe
    ? await prisma.jogo.findMany({
        where: {
          equipeId: equipe.id,
          OR: QA_MATCHES.map((matchDefinition) => ({
            adversario: matchDefinition.opponentName,
            campeonato: matchDefinition.competitionName,
            data: qaMatchDate(matchDefinition.matchDate),
          })),
        },
        select: { id: true, campeonato: true },
      })
    : [];

  const campeonatoJogos =
    campeonatos.length > 0 && jogos.length > 0
      ? await prisma.campeonatosJogos.findMany({
          where: {
            campeonatoId: { in: campeonatos.map((item) => item.id) },
            jogoId: { in: jogos.map((item) => item.id) },
          },
          select: { id: true },
        })
      : [];

  const estatisticasEquipe =
    jogos.length > 0
      ? await prisma.jogosEstatisticasEquipe.findMany({
          where: { jogoId: { in: jogos.map((item) => item.id) } },
          select: { id: true },
        })
      : [];

  const estatisticasJogador =
    jogos.length > 0
      ? await prisma.jogosEstatisticasJogador.findMany({
          where: { jogoId: { in: jogos.map((item) => item.id) } },
          select: { id: true },
        })
      : [];

  const eventos =
    jogos.length > 0
      ? await prisma.jogosEventos.findMany({
          where: { jogoId: { in: jogos.map((item) => item.id) } },
          select: { id: true },
        })
      : [];

  return {
    user,
    tecnico,
    clube,
    equipe,
    jogadores,
    vinculosJogadores,
    competicoes,
    campeonatos,
    jogos,
    campeonatoJogos,
    estatisticasEquipe,
    estatisticasJogador,
    eventos,
  };
}

function buildCleanupPlan(targets: Awaited<ReturnType<typeof loadCleanupTargets>>): CleanupCounts {
  return {
    campeonatoJogo: targets.campeonatoJogos.length,
    estatisticasEquipe: targets.estatisticasEquipe.length,
    estatisticasJogador: targets.estatisticasJogador.length,
    eventos: targets.eventos.length,
    jogo: targets.jogos.length,
    campeonato: targets.campeonatos.length,
    competicao: targets.competicoes.length,
    vinculosJogadores: targets.vinculosJogadores.length,
    jogadores: targets.jogadores.length,
    equipe: targets.equipe ? 1 : 0,
    clube: targets.clube ? 1 : 0,
    tecnico: targets.tecnico ? 1 : 0,
    user: targets.user ? 1 : 0,
  };
}

async function runCleanup(plan: CleanupCounts, targets: Awaited<ReturnType<typeof loadCleanupTargets>>): Promise<void> {
  const removed = { ...EMPTY_COUNTS };

  await prisma.$transaction(async (tx) => {
    if (targets.campeonatoJogos.length > 0) {
      const result = await tx.campeonatosJogos.deleteMany({
        where: { id: { in: targets.campeonatoJogos.map((item) => item.id) } },
      });
      removed.campeonatoJogo = result.count;
    }

    if (targets.estatisticasEquipe.length > 0) {
      const result = await tx.jogosEstatisticasEquipe.deleteMany({
        where: { id: { in: targets.estatisticasEquipe.map((item) => item.id) } },
      });
      removed.estatisticasEquipe = result.count;
    }

    if (targets.estatisticasJogador.length > 0) {
      const result = await tx.jogosEstatisticasJogador.deleteMany({
        where: { id: { in: targets.estatisticasJogador.map((item) => item.id) } },
      });
      removed.estatisticasJogador = result.count;
    }

    if (targets.eventos.length > 0) {
      const result = await tx.jogosEventos.deleteMany({
        where: { id: { in: targets.eventos.map((item) => item.id) } },
      });
      removed.eventos = result.count;
    }

    if (targets.jogos.length > 0) {
      const result = await tx.jogo.deleteMany({
        where: { id: { in: targets.jogos.map((item) => item.id) } },
      });
      removed.jogo = result.count;
    }

    if (targets.campeonatos.length > 0) {
      const result = await tx.campeonato.deleteMany({
        where: { id: { in: targets.campeonatos.map((item) => item.id) } },
      });
      removed.campeonato = result.count;
    }

    if (targets.competicoes.length > 0) {
      const result = await tx.competicao.deleteMany({
        where: { id: { in: targets.competicoes.map((item) => item.id) } },
      });
      removed.competicao = result.count;
    }

    if (targets.vinculosJogadores.length > 0) {
      const result = await tx.equipesJogadores.deleteMany({
        where: { id: { in: targets.vinculosJogadores.map((item) => item.id) } },
      });
      removed.vinculosJogadores = result.count;
    }

    if (targets.jogadores.length > 0) {
      const result = await tx.jogador.deleteMany({
        where: { id: { in: targets.jogadores.map((item) => item.id) } },
      });
      removed.jogadores = result.count;
    }

    if (targets.equipe) {
      await tx.equipe.delete({ where: { id: targets.equipe.id } });
      removed.equipe = 1;
    }

    if (targets.clube) {
      await tx.clube.delete({ where: { id: targets.clube.id } });
      removed.clube = 1;
    }

    if (targets.tecnico) {
      await tx.tecnico.delete({ where: { id: targets.tecnico.id } });
      removed.tecnico = 1;
    }

    if (targets.user) {
      await tx.user.delete({ where: { id: targets.user.id } });
      removed.user = 1;
    }
  });

  printCounts('Resumo removido nesta execucao', removed);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = isDryRun(args);
  const targets = await loadCleanupTargets();
  const plan = buildCleanupPlan(targets);

  console.log('Cleanup seguro do ambiente QA oficial');
  QA_MATCHES.forEach((matchDefinition) => {
    console.log(`- partida QA monitorada: ${matchDefinition.matchLabel}`);
  });
  printCounts('Registros QA localizados para remocao', plan);

  if (dryRun) {
    console.log('\nDry-run concluido. Nenhuma alteracao foi realizada.');
    return;
  }

  if (process.env[QA_CLEANUP_GUARD] !== 'true') {
    throw new Error(`Execucao bloqueada. Defina ${QA_CLEANUP_GUARD}=true para permitir cleanup QA.`);
  }

  if (process.env.QA_CLEANUP_CONFIRM !== QA_CLEANUP_CONFIRMATION) {
    throw new Error(`Cleanup bloqueado. Defina QA_CLEANUP_CONFIRM=${QA_CLEANUP_CONFIRMATION} para confirmar a exclusao dos registros QA.`);
  }

  await runCleanup(plan, targets);
  console.log('\nCleanup oficial do ambiente QA concluido sem tocar dados fora do escopo QA.');
}

main()
  .catch((error) => {
    console.error('\n[cleanup-qa-environment] Falha:', error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
