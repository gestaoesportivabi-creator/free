import bcrypt from 'bcrypt';
import prisma from '../src/config/database';
import {
  QA_ENVIRONMENT,
  QA_SEED_GUARD,
  ensureQaPrefix,
  isDryRun,
  listQaMatches,
  normalizeEmail,
  qaMatchDate,
  type QaMatchDefinition,
  type QaMatchKey,
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

interface QaMatchState {
  definition: QaMatchDefinition;
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
}

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
  jogadores: Array<{
    id: string;
    nome: string;
    numeroCamisa: number | null;
  }>;
  vinculosJogadores: Array<{
    id: string;
    jogadorId: string;
  }>;
  matches: Record<QaMatchKey, QaMatchState>;
}

interface SeedExecutionSummary {
  created: PlanCounts;
  normalizedMatches: QaMatchKey[];
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

const QA_MATCHES = listQaMatches();

function cloneCounts(): PlanCounts {
  return { ...EMPTY_COUNTS };
}

function zeroTeamStats() {
  return {
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
  };
}

function assertGuards(): void {
  ensureQaPrefix(QA_ENVIRONMENT.tenantName, 'Tenant QA');
  ensureQaPrefix(QA_ENVIRONMENT.clubName, 'Clube QA');
  ensureQaPrefix(QA_ENVIRONMENT.teamName, 'Equipe QA');
  QA_MATCHES.forEach((matchDefinition) => {
    ensureQaPrefix(matchDefinition.competitionName, `Competicao QA (${matchDefinition.key})`);
    ensureQaPrefix(matchDefinition.matchLabel, `Partida QA (${matchDefinition.key})`);
    ensureQaPrefix(matchDefinition.opponentName, `Adversario QA (${matchDefinition.key})`);
  });
  QA_ENVIRONMENT.playerNames.forEach((name) => ensureQaPrefix(name, 'Atleta QA'));
}

async function loadMatchState(
  equipeId: string | null,
  definition: QaMatchDefinition
): Promise<QaMatchState> {
  const competicao = await prisma.competicao.findUnique({
    where: { nome: definition.competitionName },
    select: { id: true, nome: true },
  });

  const campeonato = equipeId
    ? await prisma.campeonato.findFirst({
        where: { equipeId, nome: definition.competitionName },
        select: { id: true, nome: true, equipeId: true },
      })
    : null;

  const jogo = equipeId
    ? await prisma.jogo.findFirst({
        where: {
          equipeId,
          adversario: definition.opponentName,
          campeonato: definition.competitionName,
          data: qaMatchDate(definition.matchDate),
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
          adversario: definition.opponentName,
        },
        select: { id: true },
      })
    : null;

  return {
    definition,
    competicao,
    campeonato,
    jogo,
    estatisticasEquipe,
    campeonatoJogo,
  };
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

  const matches = {} as Record<QaMatchKey, QaMatchState>;
  for (const matchDefinition of QA_MATCHES) {
    matches[matchDefinition.key] = await loadMatchState(equipe?.id ?? null, matchDefinition);
  }

  return {
    roleId: role.id,
    user: user
      ? { id: user.id, email: user.email, name: user.name, roleName: user.role.name }
      : null,
    tecnico,
    clube,
    equipe,
    jogadores,
    vinculosJogadores,
    matches,
  };
}

function buildPlan(state: QaState): PlanCounts {
  const plan = cloneCounts();
  if (!state.user) plan.user = 1;
  if (!state.tecnico) plan.tecnico = 1;
  if (!state.clube) plan.clube = 1;
  if (!state.equipe) plan.equipe = 1;
  plan.jogadores = QA_ENVIRONMENT.playerNames.length - state.jogadores.length;
  plan.vinculosJogadores = QA_ENVIRONMENT.playerNames.length - state.vinculosJogadores.length;

  for (const matchDefinition of QA_MATCHES) {
    const matchState = state.matches[matchDefinition.key];
    if (!matchState.competicao) plan.competicao += 1;
    if (!matchState.campeonato) plan.campeonato += 1;
    if (!matchState.jogo) plan.jogo += 1;
    if (!matchState.estatisticasEquipe) plan.estatisticasEquipe += 1;
    if (!matchState.campeonatoJogo) plan.campeonatoJogo += 1;
  }

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

function printNormalizationPreview(state: QaState): void {
  const resettableMatches = QA_MATCHES.filter(
    (matchDefinition) => matchDefinition.resetOnSeed && state.matches[matchDefinition.key].jogo
  );
  if (resettableMatches.length === 0) {
    console.log('\nPartidas QA que serao normalizadas nesta execucao');
    console.log('- nenhuma');
    return;
  }

  console.log('\nPartidas QA que serao normalizadas nesta execucao');
  resettableMatches.forEach((matchDefinition) => {
    console.log(`- ${matchDefinition.matchLabel}`);
  });
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

async function ensureQaMatch(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  equipeId: string,
  definition: QaMatchDefinition,
  created: PlanCounts,
  normalizedMatches: Set<QaMatchKey>
): Promise<void> {
  let competicao = await tx.competicao.findUnique({
    where: { nome: definition.competitionName },
    select: { id: true },
  });
  if (!competicao) {
    competicao = await tx.competicao.create({
      data: { nome: definition.competitionName },
      select: { id: true },
    });
    created.competicao += 1;
  }

  let campeonato = await tx.campeonato.findFirst({
    where: { equipeId, nome: definition.competitionName },
    select: { id: true },
  });
  if (!campeonato) {
    campeonato = await tx.campeonato.create({
      data: {
        nome: definition.competitionName,
        equipeId,
        dados: {
          qaLabel: definition.matchLabel,
          qaScenario: definition.key,
        },
      },
      select: { id: true },
    });
    created.campeonato += 1;
  }

  let jogo = await tx.jogo.findFirst({
    where: {
      equipeId,
      adversario: definition.opponentName,
      campeonato: definition.competitionName,
      data: qaMatchDate(definition.matchDate),
    },
    select: { id: true },
  });
  if (!jogo) {
    jogo = await tx.jogo.create({
      data: {
        equipeId,
        adversario: definition.opponentName,
        data: qaMatchDate(definition.matchDate),
        campeonato: definition.competitionName,
        competicaoId: competicao.id,
        local: definition.matchLocation,
        resultado: 'E',
        golsPro: 0,
        golsContra: 0,
        observacoes: definition.matchLabel,
        status: definition.status,
        collectionPhase: definition.collectionPhase,
        postMatchEventLog: [],
        lineup: {
          qaEnvironment: true,
          qaScenario: definition.key,
        },
      },
      select: { id: true },
    });
    created.jogo += 1;
  } else if (definition.resetOnSeed) {
    await tx.jogosEventos.deleteMany({ where: { jogoId: jogo.id } });
    await tx.jogosEstatisticasJogador.deleteMany({ where: { jogoId: jogo.id } });
    await tx.jogo.update({
      where: { id: jogo.id },
      data: {
        competicaoId: competicao.id,
        local: definition.matchLocation,
        resultado: 'E',
        golsPro: 0,
        golsContra: 0,
        observacoes: definition.matchLabel,
        status: definition.status,
        collectionPhase: definition.collectionPhase,
        postMatchEventLog: [],
        lineup: {
          qaEnvironment: true,
          qaScenario: definition.key,
        },
      },
    });
    normalizedMatches.add(definition.key);
  }

  const existingStats = await tx.jogosEstatisticasEquipe.findUnique({
    where: { jogoId: jogo.id },
    select: { id: true },
  });
  if (!existingStats) {
    await tx.jogosEstatisticasEquipe.create({
      data: {
        jogoId: jogo.id,
        ...zeroTeamStats(),
      },
    });
    created.estatisticasEquipe += 1;
  } else if (definition.resetOnSeed) {
    await tx.jogosEstatisticasEquipe.update({
      where: { jogoId: jogo.id },
      data: zeroTeamStats(),
    });
    normalizedMatches.add(definition.key);
  }

  let campeonatoJogo = await tx.campeonatosJogos.findFirst({
    where: {
      campeonatoId: campeonato.id,
      jogoId: jogo.id,
    },
    select: { id: true },
  });
  if (!campeonatoJogo) {
    campeonatoJogo = await tx.campeonatosJogos.create({
      data: {
        campeonatoId: campeonato.id,
        data: qaMatchDate(definition.matchDate),
        horario: '20:00',
        equipe: QA_ENVIRONMENT.teamName,
        adversario: definition.opponentName,
        competicao: definition.competitionName,
        local: definition.matchLocation,
        metaPontuacao: definition.matchLabel,
        jogoId: jogo.id,
      },
      select: { id: true },
    });
    created.campeonatoJogo += 1;
  } else if (definition.resetOnSeed) {
    await tx.campeonatosJogos.update({
      where: { id: campeonatoJogo.id },
      data: {
        data: qaMatchDate(definition.matchDate),
        horario: '20:00',
        equipe: QA_ENVIRONMENT.teamName,
        adversario: definition.opponentName,
        competicao: definition.competitionName,
        local: definition.matchLocation,
        metaPontuacao: definition.matchLabel,
      },
    });
    normalizedMatches.add(definition.key);
  }
}

async function executeSeed(plan: PlanCounts, password: string | null): Promise<SeedExecutionSummary> {
  const created = cloneCounts();
  const normalizedMatches = new Set<QaMatchKey>();
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

    for (const matchDefinition of QA_MATCHES) {
      await ensureQaMatch(tx, equipe.id, matchDefinition, created, normalizedMatches);
    }
  }, {
    maxWait: 10000,
    timeout: 60000,
  });

  return {
    created,
    normalizedMatches: Array.from(normalizedMatches),
  };
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
  QA_MATCHES.forEach((matchDefinition) => {
    console.log(`- partida (${matchDefinition.key}): ${matchDefinition.matchLabel}`);
  });
  printPlan('Quantidade prevista de registros a criar', plan);
  printNormalizationPreview(state);

  const password = requirePasswordIfNeeded(plan, dryRun);

  if (dryRun) {
    console.log('\nDry-run concluido. Nenhuma alteracao foi realizada.');
    return;
  }

  if (process.env[QA_SEED_GUARD] !== 'true') {
    throw new Error(`Execucao bloqueada. Defina ${QA_SEED_GUARD}=true para permitir a criacao do ambiente QA.`);
  }

  const summary = await executeSeed(plan, password);
  printPlan('Resumo criado nesta execucao', summary.created);
  console.log('\nPartidas QA normalizadas nesta execucao');
  if (summary.normalizedMatches.length === 0) {
    console.log('- nenhuma');
  } else {
    summary.normalizedMatches.forEach((key) => {
      const matchDefinition = QA_MATCHES.find((item) => item.key === key);
      console.log(`- ${matchDefinition?.matchLabel ?? key}`);
    });
  }
}

main()
  .catch((error) => {
    console.error('\n[seed-qa-environment] Falha:', error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
