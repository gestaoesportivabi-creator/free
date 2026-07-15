import bcrypt from 'bcrypt';
import prisma from '../src/config/database';
import {
  QA_ENVIRONMENT,
  QA_SEED_GUARD,
  ensureQaPrefix,
  isDryRun,
  normalizeEmail,
  qaMatchDate,
} from './helpers/qa-environment';

type PlannedEntity =
  | 'user'
  | 'tecnico'
  | 'clube'
  | 'equipe'
  | 'competicao'
  | 'campeonato'
  | 'jogo'
  | 'estatisticasEquipe'
  | 'campeonatoJogo'
  | 'jogadores'
  | 'vinculosJogadores';

type PlanCounts = Record<PlannedEntity, number>;

interface QaState {
  roleId: string;
  user: {
    id: string;
    email: string;
    name: string;
    roleName: string;
  } | null;
  tecnico: {
    id: string;
    userId: string;
    nome: string;
  } | null;
  clube: {
    id: string;
    userId: string;
    razaoSocial: string;
    cnpj: string;
  } | null;
  equipe: {
    id: string;
    nome: string;
    tecnicoId: string;
    clubeId: string | null;
  } | null;
  competicao: {
    id: string;
    nome: string;
  } | null;
  campeonato: {
    id: string;
    nome: string;
    equipeId: string | null;
  } | null;
  jogo: {
    id: string;
  } | null;
  estatisticasEquipe: {
    id: string;
  } | null;
  campeonatoJogo: {
    id: string;
  } | null;
  jogadores: Array<{
    id: string;
    nome: string;
    numeroCamisa: number | null;
  }>;
  vinculosJogadores: Array<{
    id: string;
    jogadorId: string;
  }>;
}

const EMPTY_COUNTS: PlanCounts = {
  user: 0,
  tecnico: 0,
  clube: 0,
  equipe: 0,
  competicao: 0,
  campeonato: 0,
  jogo: 0,
  estatisticasEquipe: 0,
  campeonatoJogo: 0,
  jogadores: 0,
  vinculosJogadores: 0,
};

function cloneCounts(): PlanCounts {
  return { ...EMPTY_COUNTS };
}

function assertGuards(): void {
  ensureQaPrefix(QA_ENVIRONMENT.tenantName, 'Tenant QA');
  ensureQaPrefix(QA_ENVIRONMENT.clubName, 'Clube QA');
  ensureQaPrefix(QA_ENVIRONMENT.teamName, 'Equipe QA');
  ensureQaPrefix(QA_ENVIRONMENT.competitionName, 'Competicao QA');
  ensureQaPrefix(QA_ENVIRONMENT.matchLabel, 'Partida QA');
  ensureQaPrefix(QA_ENVIRONMENT.opponentName, 'Adversario QA');
  QA_ENVIRONMENT.playerNames.forEach((name) => ensureQaPrefix(name, 'Atleta QA'));
}

async function loadQaState(): Promise<QaState> {
  const role = await prisma.role.findUnique({
    where: { name: QA_ENVIRONMENT.userRole },
    select: { id: true },
  });
  if (!role) {
    throw new Error(`Role ${QA_ENVIRONMENT.userRole} nao encontrada. O ambiente base precisa estar inicializado antes do seed QA.`);
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(QA_ENVIRONMENT.userEmail) },
    select: {
      id: true,
      email: true,
      name: true,
      role: { select: { name: true } },
    },
  });
  if (user && (user.name !== QA_ENVIRONMENT.tenantName || user.role.name !== QA_ENVIRONMENT.userRole)) {
    throw new Error(`Conflito de seguranca: o email ${QA_ENVIRONMENT.userEmail} ja pertence a um usuario nao-QA esperado.`);
  }

  const tecnico = user
    ? await prisma.tecnico.findUnique({
        where: { userId: user.id },
        select: { id: true, userId: true, nome: true },
      })
    : null;
  if (tecnico && tecnico.nome !== QA_ENVIRONMENT.tenantName) {
    throw new Error('Conflito de seguranca: tecnico vinculado ao usuario QA nao corresponde ao tenant QA esperado.');
  }

  const clube = user
    ? await prisma.clube.findUnique({
        where: { userId: user.id },
        select: { id: true, userId: true, razaoSocial: true, cnpj: true },
      })
    : null;
  if (clube && clube.razaoSocial !== QA_ENVIRONMENT.clubName) {
    throw new Error('Conflito de seguranca: clube vinculado ao usuario QA nao corresponde ao clube QA esperado.');
  }

  const equipe = tecnico
    ? await prisma.equipe.findFirst({
        where: { tecnicoId: tecnico.id, nome: QA_ENVIRONMENT.teamName },
        select: { id: true, nome: true, tecnicoId: true, clubeId: true },
      })
    : null;
  if (equipe && equipe.nome !== QA_ENVIRONMENT.teamName) {
    throw new Error('Conflito de seguranca: equipe QA encontrada com nome divergente.');
  }

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
        select: { id: true, nome: true, numeroCamisa: true },
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

  const competicao = await prisma.competicao.findUnique({
    where: { nome: QA_ENVIRONMENT.competitionName },
    select: { id: true, nome: true },
  });

  const campeonato = equipe
    ? await prisma.campeonato.findFirst({
        where: { equipeId: equipe.id, nome: QA_ENVIRONMENT.competitionName },
        select: { id: true, nome: true, equipeId: true },
      })
    : null;

  const jogo = equipe
    ? await prisma.jogo.findFirst({
        where: {
          equipeId: equipe.id,
          adversario: QA_ENVIRONMENT.opponentName,
          campeonato: QA_ENVIRONMENT.competitionName,
          data: qaMatchDate(),
        },
        select: { id: true },
      })
    : null;

  const estatisticasEquipe = jogo
    ? await prisma.jogosEstatisticasEquipe.findUnique({
        where: { jogoId: jogo.id },
        select: { id: true },
      })
    : null;

  const campeonatoJogo = campeonato && jogo
    ? await prisma.campeonatosJogos.findFirst({
        where: {
          campeonatoId: campeonato.id,
          jogoId: jogo.id,
          adversario: QA_ENVIRONMENT.opponentName,
        },
        select: { id: true },
      })
    : null;

  return {
    roleId: role.id,
    user: user
      ? { id: user.id, email: user.email, name: user.name, roleName: user.role.name }
      : null,
    tecnico,
    clube,
    equipe,
    competicao,
    campeonato,
    jogo,
    estatisticasEquipe,
    campeonatoJogo,
    jogadores,
    vinculosJogadores,
  };
}

function buildPlan(state: QaState): PlanCounts {
  const plan = cloneCounts();
  if (!state.user) plan.user = 1;
  if (!state.tecnico) plan.tecnico = 1;
  if (!state.clube) plan.clube = 1;
  if (!state.equipe) plan.equipe = 1;
  if (!state.competicao) plan.competicao = 1;
  if (!state.campeonato) plan.campeonato = 1;
  if (!state.jogo) plan.jogo = 1;
  if (!state.estatisticasEquipe) plan.estatisticasEquipe = 1;
  if (!state.campeonatoJogo) plan.campeonatoJogo = 1;
  plan.jogadores = QA_ENVIRONMENT.playerNames.length - state.jogadores.length;
  plan.vinculosJogadores = QA_ENVIRONMENT.playerNames.length - state.vinculosJogadores.length;
  return plan;
}

function sumPlan(plan: PlanCounts): number {
  return Object.values(plan).reduce((total, value) => total + value, 0);
}

function printPlan(title: string, plan: PlanCounts): void {
  console.log(`\n${title}`);
  (Object.keys(plan) as PlannedEntity[]).forEach((key) => {
    console.log(`- ${key}: ${plan[key]}`);
  });
  console.log(`- total: ${sumPlan(plan)}`);
}

function requirePasswordIfNeeded(plan: PlanCounts, dryRun: boolean): string | null {
  const password = process.env.QA_ENVIRONMENT_PASSWORD ?? '';
  if (dryRun || plan.user === 0) {
    return password || null;
  }
  if (password.trim().length < 10) {
    throw new Error('QA_ENVIRONMENT_PASSWORD precisa ter ao menos 10 caracteres para criar o usuario QA.');
  }
  return password;
}

async function executeSeed(plan: PlanCounts, password: string | null): Promise<void> {
  const created = cloneCounts();
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  await prisma.$transaction(async (tx) => {
    let user = await tx.user.findUnique({
      where: { email: normalizeEmail(QA_ENVIRONMENT.userEmail) },
      select: { id: true },
    });

    if (!user) {
      if (!passwordHash) {
        throw new Error('Senha QA nao disponivel para criar o usuario.');
      }
      user = await tx.user.create({
        data: {
          email: normalizeEmail(QA_ENVIRONMENT.userEmail),
          passwordHash,
          name: QA_ENVIRONMENT.tenantName,
          roleId: (await tx.role.findUniqueOrThrow({ where: { name: QA_ENVIRONMENT.userRole } })).id,
          isActive: true,
        },
        select: { id: true },
      });
      created.user = 1;
    }

    let tecnico = await tx.tecnico.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!tecnico) {
      tecnico = await tx.tecnico.create({
        data: {
          userId: user.id,
          nome: QA_ENVIRONMENT.tenantName,
        },
        select: { id: true },
      });
      created.tecnico = 1;
    }

    let clube = await tx.clube.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!clube) {
      clube = await tx.clube.create({
        data: {
          userId: user.id,
          razaoSocial: QA_ENVIRONMENT.clubName,
          cnpj: QA_ENVIRONMENT.clubCnpj,
        },
        select: { id: true },
      });
      created.clube = 1;
    }

    let equipe = await tx.equipe.findFirst({
      where: { tecnicoId: tecnico.id, nome: QA_ENVIRONMENT.teamName },
      select: { id: true },
    });
    if (!equipe) {
      equipe = await tx.equipe.create({
        data: {
          nome: QA_ENVIRONMENT.teamName,
          categoria: QA_ENVIRONMENT.teamCategory,
          temporada: QA_ENVIRONMENT.teamSeason,
          tecnicoId: tecnico.id,
          clubeId: clube.id,
        },
        select: { id: true },
      });
      created.equipe = 1;
    }

    for (let index = 0; index < QA_ENVIRONMENT.playerNames.length; index += 1) {
      const playerName = QA_ENVIRONMENT.playerNames[index];
      let jogador = await tx.jogador.findFirst({
        where: {
          nome: playerName,
          equipes: {
            some: {
              equipeId: equipe.id,
              dataFim: null,
            },
          },
        },
        select: { id: true },
      });
      if (!jogador) {
        jogador = await tx.jogador.create({
          data: {
            nome: playerName,
            apelido: playerName,
            funcaoEmQuadra: index === 0 ? 'Goleiro' : index < 3 ? 'Ala' : index === 5 ? 'Pivo' : 'Fixo',
            numeroCamisa: index + 1,
            isAtivo: true,
          },
          select: { id: true },
        });
        created.jogadores += 1;
      }

      const link = await tx.equipesJogadores.findFirst({
        where: {
          equipeId: equipe.id,
          jogadorId: jogador.id,
          dataFim: null,
        },
        select: { id: true },
      });
      if (!link) {
        await tx.equipesJogadores.create({
          data: {
            equipeId: equipe.id,
            jogadorId: jogador.id,
            dataInicio: qaMatchDate(),
          },
        });
        created.vinculosJogadores += 1;
      }
    }

    let competicao = await tx.competicao.findUnique({
      where: { nome: QA_ENVIRONMENT.competitionName },
      select: { id: true },
    });
    if (!competicao) {
      competicao = await tx.competicao.create({
        data: { nome: QA_ENVIRONMENT.competitionName },
        select: { id: true },
      });
      created.competicao = 1;
    }

    let campeonato = await tx.campeonato.findFirst({
      where: { equipeId: equipe.id, nome: QA_ENVIRONMENT.competitionName },
      select: { id: true },
    });
    if (!campeonato) {
      campeonato = await tx.campeonato.create({
        data: {
          nome: QA_ENVIRONMENT.competitionName,
          equipeId: equipe.id,
          dados: {
            qaLabel: QA_ENVIRONMENT.matchLabel,
          },
        },
        select: { id: true },
      });
      created.campeonato = 1;
    }

    let jogo = await tx.jogo.findFirst({
      where: {
        equipeId: equipe.id,
        adversario: QA_ENVIRONMENT.opponentName,
        campeonato: QA_ENVIRONMENT.competitionName,
        data: qaMatchDate(),
      },
      select: { id: true },
    });
    if (!jogo) {
      jogo = await tx.jogo.create({
        data: {
          equipeId: equipe.id,
          adversario: QA_ENVIRONMENT.opponentName,
          data: qaMatchDate(),
          campeonato: QA_ENVIRONMENT.competitionName,
          competicaoId: competicao.id,
          local: QA_ENVIRONMENT.matchLocation,
          resultado: 'E',
          golsPro: 0,
          golsContra: 0,
          observacoes: QA_ENVIRONMENT.matchLabel,
          status: 'em_andamento',
          collectionPhase: 0,
          postMatchEventLog: [],
          lineup: {
            qaEnvironment: true,
          },
        },
        select: { id: true },
      });
      created.jogo = 1;
    }

    const estatisticasEquipe = await tx.jogosEstatisticasEquipe.findUnique({
      where: { jogoId: jogo.id },
      select: { id: true },
    });
    if (!estatisticasEquipe) {
      await tx.jogosEstatisticasEquipe.create({
        data: {
          jogoId: jogo.id,
          minutosJogados: 40,
          gols: 0,
          golsSofridos: 0,
          assistencias: 0,
          cartoesAmarelos: 0,
          cartoesVermelhos: 0,
          passesCorretos: 0,
          passesErrados: 0,
          passesErradosTransicao: 0,
          desarmesComBola: 0,
          desarmesContraAtaque: 0,
          desarmesSemBola: 0,
          chutesNoGol: 0,
          chutesFora: 0,
          golsMarcadosJogoAberto: 0,
          golsMarcadosBolaParada: 0,
          golsSofridosJogoAberto: 0,
          golsSofridosBolaParada: 0,
        },
      });
      created.estatisticasEquipe = 1;
    }

    const campeonatoJogo = await tx.campeonatosJogos.findFirst({
      where: {
        campeonatoId: campeonato.id,
        jogoId: jogo.id,
      },
      select: { id: true },
    });
    if (!campeonatoJogo) {
      await tx.campeonatosJogos.create({
        data: {
          campeonatoId: campeonato.id,
          data: qaMatchDate(),
          horario: '20:00',
          equipe: QA_ENVIRONMENT.teamName,
          adversario: QA_ENVIRONMENT.opponentName,
          competicao: QA_ENVIRONMENT.competitionName,
          local: QA_ENVIRONMENT.matchLocation,
          metaPontuacao: QA_ENVIRONMENT.matchLabel,
          jogoId: jogo.id,
        },
        });
      created.campeonatoJogo = 1;
    }
  }, {
    maxWait: 10000,
    timeout: 60000,
  });

  printPlan('Resumo criado nesta execucao', created);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = isDryRun(args);

  assertGuards();

  const state = await loadQaState();
  const plan = buildPlan(state);

  console.log('Ambiente QA oficial do cronometro');
  console.log(`- tenant: ${QA_ENVIRONMENT.tenantName}`);
  console.log(`- clube: ${QA_ENVIRONMENT.clubName}`);
  console.log(`- equipe: ${QA_ENVIRONMENT.teamName}`);
  console.log(`- usuario: ${QA_ENVIRONMENT.userEmail}`);
  console.log(`- partida: ${QA_ENVIRONMENT.matchLabel}`);
  printPlan('Quantidade prevista de registros a criar', plan);

  const password = requirePasswordIfNeeded(plan, dryRun);

  if (dryRun) {
    console.log('\nDry-run concluido. Nenhuma alteracao foi realizada.');
    return;
  }

  if (process.env[QA_SEED_GUARD] !== 'true') {
    throw new Error(`Execucao bloqueada. Defina ${QA_SEED_GUARD}=true para criar o ambiente QA.`);
  }

  await executeSeed(plan, password);
  console.log('\nSeed oficial do ambiente QA concluido sem duplicar registros existentes.');
}

main()
  .catch((error) => {
    console.error('\n[seed-qa-environment] Falha:', error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
