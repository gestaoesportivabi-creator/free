/**
 * Seed LNF Silver 2026 — Chopinzinho (Daniel Junior)
 * Fonte: transmissões YouTube FCFS/LNF (legendas PT)
 *
 * Uso: npm run seed:chopinzinho
 */

import prisma from '../src/config/database';
import { matchesRepository } from '../src/repositories/matches.repository';

const DANIEL_USER_ID = '0b1b468f-274f-49e7-8624-2dbe4670eea5';
const DANIEL_TECNICO_ID = 'ca6eafcf-5451-40c5-9cb8-2ce9a2852938';

const COMPETICAO = 'LNF Silver 2026';
const CANAL_LNF = 'https://www.youtube.com/@LigaNacionaldeFutsal';

type PlayerSeed = {
  apelido: string;
  nome?: string;
  numero: number;
  funcao: string;
};

const CHOPINZINHO_PLAYERS: PlayerSeed[] = [
  { apelido: 'João Neto', numero: 19, funcao: 'Goleiro' },
  { apelido: 'Capa', nome: 'Douglas Capa', numero: 20, funcao: 'Ala' },
  { apelido: 'Ian', nome: 'Ian Lucas', numero: 8, funcao: 'Ala' },
  { apelido: 'Jamor', numero: 42, funcao: 'Ala' },
  { apelido: 'Lucão', numero: 14, funcao: 'Ala' },
  { apelido: 'Thales', numero: 16, funcao: 'Ala' },
  { apelido: 'Suelton', numero: 22, funcao: 'Ala' },
  { apelido: 'Breno', numero: 99, funcao: 'Pivo' },
  { apelido: 'Elenilson', numero: 17, funcao: 'Ala' },
  { apelido: 'Wagner Souza', numero: 9, funcao: 'Pivo' },
  { apelido: 'Guilherme Maia', numero: 10, funcao: 'Ala' },
  { apelido: 'Hulk', numero: 12, funcao: 'Ala' },
  { apelido: 'Kelvin', numero: 11, funcao: 'Ala' },
  { apelido: 'Gonzales', numero: 13, funcao: 'Fixo' },
  { apelido: 'São Pedro', numero: 5, funcao: 'Ala' },
  { apelido: 'Emerson', numero: 6, funcao: 'Ala' },
  { apelido: 'Anderson Melo', numero: 23, funcao: 'Ala' },
  { apelido: 'Jeanderson', numero: 18, funcao: 'Ala' },
  { apelido: 'Antônio', numero: 4, funcao: 'Fixo' },
  { apelido: 'Bucão', numero: 15, funcao: 'Ala' },
];

type GoalEvent = {
  minuto: number;
  periodo: string;
  autor: string;
  numero?: number;
  time: 'pro' | 'contra';
  descricao?: string;
};

type GameSeed = {
  data: string;
  adversario: string;
  local: string;
  mandante: boolean;
  resultado: 'V' | 'E' | 'D';
  golsPro: number;
  golsContra: number;
  videoUrl: string;
  rodada: string;
  observacoes: string;
  lineup: { titulares: string[]; reservas: string[] };
  gols: GoalEvent[];
  adversarioInfo: {
    tecnicoNome?: string;
    pontosFortes?: string;
    pontosFracos?: string;
    analiseTexto: string;
    observacoes?: string;
    elencoDestaque?: string[];
  };
};

const GAMES: GameSeed[] = [
  {
    data: '2026-05-23',
    adversario: 'Dracena',
    local: 'Dracena/SP',
    mandante: false,
    resultado: 'E',
    golsPro: 2,
    golsContra: 2,
    videoUrl: 'https://www.youtube.com/watch?v=ECuPMQLOF1c',
    rodada: 'Rodada 06',
    observacoes:
      'Transmissão LNF Silver. Capa marcou os dois gols do Chopinzinho; Luquinhas e Cardoso marcaram pelo Dracena. Jogo equilibrado — empate 2×2 com Dracena pressionando no fim.',
    lineup: {
      titulares: ['João Neto', 'Ian', 'Jamor', 'Capa'],
      reservas: ['Hulk', 'Gonzales', 'Kelvin', 'Lucão', 'Elenilson'],
    },
    gols: [
      { minuto: 28, periodo: '1T', autor: 'Capa', numero: 20, time: 'pro', descricao: 'Abre o placar para o Chopinzinho' },
      { minuto: 67, periodo: '2T', autor: 'Luquinhas', numero: 8, time: 'contra', descricao: 'Gol de Luquinhas — Dracena empata' },
      { minuto: 78, periodo: '2T', autor: 'Capa', numero: 20, time: 'pro', descricao: 'Capa marca novamente — autor dos dois gols da Cel' },
      { minuto: 91, periodo: '2T', autor: 'Cardoso', numero: 13, time: 'contra', descricao: 'Gol de Cardoso — empate final 2×2' },
    ],
    adversarioInfo: {
      tecnicoNome: 'Edilson Leite',
      pontosFortes: 'Luquinhas armando jogadas pela esquerda; Modesto #77; transição rápida com Cardoso #13.',
      pontosFracos: 'Vulnerável quando Chopinzinho acelera com Capa e Jamor no corredor direito.',
      analiseTexto:
        'Dracena (Cel) recebeu o Chopinzinho na 6ª rodada da LNF Silver 2026. Escalação citada: Thiago #98 (GK), Modesto #77, Luquinhas #8, Cardoso #13, Nandinho #10. Campanha pré-jogo: vice-liderança em disputa — vitória do Chopinzinho o colocaria como vice-líder. Confronto físico; Lucão foi destaque ofensivo no 1T sem converter.',
      observacoes: 'Técnico Edilson Leite. Uniforme azul/branco. GK Thiago #98.',
      elencoDestaque: ['Luquinhas', 'Cardoso', 'Modesto', 'Thiago'],
    },
  },
  {
    data: '2026-05-28',
    adversario: 'São Lourenço',
    local: 'Chopinzinho/PR',
    mandante: true,
    resultado: 'V',
    golsPro: 2,
    golsContra: 0,
    videoUrl: 'https://www.youtube.com/watch?v=N0GbxK8rX4k',
    rodada: 'Rodada 07',
    observacoes:
      'Vitória mandante 2×0. Wagner Souza marcou os dois gols. João Neto defendeu bem (incl. 1×0 no 2T). Chopinzinho consolidou sequência positiva após empate em Dracena.',
    lineup: {
      titulares: ['João Neto', 'Ian', 'Jamor', 'Capa'],
      reservas: ['Lucão', 'Thales', 'Hulk', 'Kelvin'],
    },
    gols: [
      { minuto: 32, periodo: '1T', autor: 'Wagner Souza', time: 'pro', descricao: 'Primeiro gol — Chopinzinho 1×0' },
      { minuto: 78, periodo: '2T', autor: 'Wagner Souza', time: 'pro', descricao: 'Segundo gol de Wagner Souza — 2×0 final' },
    ],
    adversarioInfo: {
      pontosFortes: 'Carlos #39 no gol; pressão alta no início; pivô forte.',
      pontosFracos: 'Dificuldade para sair pressionado; pouca reação após 1×0.',
      analiseTexto:
        'São Lourenço visitou Chopinzinho na 7ª rodada. Escalação citada: Carlos #39 (GK), Tauan #21, Ian Lucas #7 (adversário), Suelton #22, Thales #16, Lucão #99. São Lourenço vinha de goleada na rodada anterior. Jogo pegado no 1T; Chopinzinho controlou melhor o 2T com Wagner Souza decisivo.',
      observacoes: 'Narrador cita professor Daniel com camisa 99 (comissão). Anderson na transmissão.',
      elencoDestaque: ['Carlos', 'Tauan', 'Lucão'],
    },
  },
  {
    data: '2026-06-03',
    adversario: 'Balsas',
    local: 'Chopinzinho/PR',
    mandante: true,
    resultado: 'V',
    golsPro: 1,
    golsContra: 0,
    videoUrl: 'https://www.youtube.com/watch?v=Xp9efnr8P3w',
    rodada: 'Rodada 08',
    observacoes:
      'Vitória magra 1×0. Jamor marcou o gol da partida; Danilo #2 (Balsas) teve boas defesas. Jogo tenso — 0×0 até o gol de Jamor. Vitória importante na briga pelo G-4 da LNF Silver.',
    lineup: {
      titulares: ['João Neto', 'Ian', 'Jamor', 'Capa'],
      reservas: ['Lucão', 'Thales', 'Hulk'],
    },
    gols: [
      { minuto: 84, periodo: '2T', autor: 'Jamor', numero: 42, time: 'pro', descricao: 'Gol de Jamor — único da partida, 1×0' },
    ],
    adversarioInfo: {
      pontosFortes: 'Danilo #2 (GK) atento; bloco compacto; dificultou zero a zero por longos períodos.',
      pontosFracos: 'Pouca criação ofensiva; dependência de contra-ataques.',
      analiseTexto:
        'Balsas (MA) visitou Chopinzinho na 8ª rodada da LNF Silver 2026. GK Danilo #2. Chopinzinho precisava vencer para subir na classificação — contexto de briga pelo G-4. Jamor e Capa citados como pilares ofensivos da campanha.',
      observacoes: 'Transmissão confirma Chopinzinho × Balsas pela LNF Silver.',
      elencoDestaque: ['Danilo'],
    },
  },
];

function buildEventLog(gols: GoalEvent[], playerMap: Map<string, string>) {
  return gols.map((g, i) => {
    const pid = playerMap.get(g.autor) ?? `ext-${g.autor.toLowerCase().replace(/\s+/g, '-')}`;
    return {
      id: `evt-${i + 1}`,
      time: `${String(g.minuto).padStart(2, '0')}:00`,
      period: g.periodo,
      playerId: g.time === 'pro' ? pid : `adv-${g.autor}`,
      playerName: g.autor,
      action: 'goal',
      tipo: 'gol',
      subtipo: g.time === 'pro' ? 'marcado' : 'sofrido',
      descricao: g.descricao ?? null,
    };
  });
}

async function upsertPlayer(equipeId: string, p: PlayerSeed): Promise<string> {
  const linked = await prisma.equipesJogadores.findFirst({
    where: {
      equipeId,
      dataFim: null,
      jogador: { apelido: { equals: p.apelido, mode: 'insensitive' } },
    },
    include: { jogador: true },
  });

  if (linked) {
    await prisma.jogador.update({
      where: { id: linked.jogadorId },
      data: {
        nome: p.nome ?? p.apelido,
        apelido: p.apelido,
        numeroCamisa: p.numero,
        funcaoEmQuadra: p.funcao,
        isAtivo: true,
      },
    });
    return linked.jogadorId;
  }

  const jogador = await prisma.jogador.create({
    data: {
      nome: p.nome ?? p.apelido,
      apelido: p.apelido,
      numeroCamisa: p.numero,
      funcaoEmQuadra: p.funcao,
    },
  });

  await prisma.equipesJogadores.create({
    data: {
      equipeId,
      jogadorId: jogador.id,
      dataInicio: new Date('2026-01-01'),
    },
  });

  return jogador.id;
}

async function main() {
  console.log('🌱 Seed Chopinzinho LNF Silver 2026\n');

  const tecnico = await prisma.tecnico.findUnique({ where: { id: DANIEL_TECNICO_ID } });
  if (!tecnico) throw new Error(`Tecnico ${DANIEL_TECNICO_ID} não encontrado`);

  const user = await prisma.user.findUnique({ where: { id: DANIEL_USER_ID } });
  if (!user) throw new Error(`User ${DANIEL_USER_ID} não encontrado`);

  let equipe = await prisma.equipe.findFirst({
    where: { tecnicoId: DANIEL_TECNICO_ID, nome: { contains: 'Chopinzinho', mode: 'insensitive' } },
  });

  if (!equipe) {
    equipe = await prisma.equipe.create({
      data: {
        nome: 'Cel Chopinzinho',
        categoria: 'Adulto',
        temporada: '2026',
        tecnicoId: DANIEL_TECNICO_ID,
      },
    });
    console.log(`✅ Equipe criada: ${equipe.nome} (${equipe.id})`);
  } else {
    console.log(`ℹ️  Equipe existente: ${equipe.nome} (${equipe.id})`);
  }

  const playerMap = new Map<string, string>();
  for (const p of CHOPINZINHO_PLAYERS) {
    const id = await upsertPlayer(equipe.id, p);
    playerMap.set(p.apelido, id);
    if (p.nome) playerMap.set(p.nome, id);
  }
  console.log(`✅ ${CHOPINZINHO_PLAYERS.length} jogadores vinculados`);

  let competicao = await prisma.competicao.findUnique({ where: { nome: COMPETICAO } });
  if (!competicao) {
    competicao = await prisma.competicao.create({ data: { nome: COMPETICAO } });
    console.log(`✅ Competição criada: ${COMPETICAO}`);
  }

  let campeonato = await prisma.campeonato.findFirst({
    where: { equipeId: equipe.id, nome: COMPETICAO },
  });
  if (!campeonato) {
    campeonato = await prisma.campeonato.create({
      data: { equipeId: equipe.id, nome: COMPETICAO },
    });
    console.log(`✅ Campeonato/tabela criado: ${COMPETICAO}`);
  }

  const canal = await prisma.youtubeCanal.findFirst({
    where: { equipeId: equipe.id, channelUrl: CANAL_LNF },
  });
  if (!canal) {
    await prisma.youtubeCanal.create({
      data: {
        equipeId: equipe.id,
        label: 'LNF — Liga Nacional de Futsal',
        channelUrl: CANAL_LNF,
        tipo: 'oficial',
      },
    });
    console.log('✅ Canal YouTube LNF cadastrado');
  }

  for (const game of GAMES) {
    const existing = await prisma.jogo.findFirst({
      where: {
        equipeId: equipe.id,
        adversario: { equals: game.adversario, mode: 'insensitive' },
        data: new Date(game.data),
      },
    });

    const lineupJson = {
      titulares: game.lineup.titulares.map((apelido) => ({
        apelido,
        jogadorId: playerMap.get(apelido) ?? null,
      })),
      reservas: game.lineup.reservas.map((apelido) => ({
        apelido,
        jogadorId: playerMap.get(apelido) ?? null,
      })),
    };

    const postMatchEventLog = buildEventLog(game.gols, playerMap);

    const jogoData = {
      equipeId: equipe.id,
      adversario: game.adversario,
      data: new Date(game.data),
      campeonato: COMPETICAO,
      competicaoId: competicao.id,
      local: game.local,
      resultado: game.resultado,
      golsPro: game.golsPro,
      golsContra: game.golsContra,
      videoUrl: game.videoUrl,
      observacoes: game.observacoes,
      postMatchEventLog,
      lineup: lineupJson,
      status: 'encerrado',
      collectionPhase: 2,
    };

    let jogoId: string;
    if (existing) {
      await prisma.jogo.update({ where: { id: existing.id }, data: jogoData });
      jogoId = existing.id;
      console.log(`🔄 Jogo atualizado: vs ${game.adversario} (${game.data})`);
    } else {
      const jogo = await prisma.jogo.create({ data: jogoData });
      jogoId = jogo.id;
      console.log(`✅ Jogo criado: vs ${game.adversario} (${game.data}) ${game.golsPro}×${game.golsContra}`);
    }

    await matchesRepository.setStatus(jogoId, 'encerrado');

    const stats = await prisma.jogosEstatisticasEquipe.findUnique({ where: { jogoId } });
    if (!stats) {
      await prisma.jogosEstatisticasEquipe.create({
        data: {
          jogoId,
          gols: game.golsPro,
          golsSofridos: game.golsContra,
          golsMarcadosJogoAberto: game.golsPro,
          minutosJogados: 40,
        },
      });
    } else {
      await prisma.jogosEstatisticasEquipe.update({
        where: { jogoId },
        data: {
          gols: game.golsPro,
          golsSofridos: game.golsContra,
          golsMarcadosJogoAberto: game.golsPro,
          minutosJogados: 40,
        },
      });
    }

    const lineupPlayers = [...game.lineup.titulares, ...game.lineup.reservas];
    for (const apelido of lineupPlayers) {
      const jogadorId = playerMap.get(apelido);
      if (!jogadorId) continue;
      const isTitular = game.lineup.titulares.includes(apelido);
      const golsCount = game.gols.filter((g) => g.time === 'pro' && g.autor === apelido).length;
      await prisma.jogosEstatisticasJogador.upsert({
        where: { jogoId_jogadorId: { jogoId, jogadorId } },
        create: {
          jogoId,
          jogadorId,
          gols: golsCount,
          minutosJogados: isTitular ? 40 : 10,
        },
        update: {
          gols: golsCount,
          minutosJogados: isTitular ? 40 : 10,
        },
      });
    }

    for (const g of game.gols.filter((x) => x.time === 'pro')) {
      const jogadorId = playerMap.get(g.autor);
      if (!jogadorId) continue;
      const existingStats = await prisma.jogosEstatisticasJogador.findUnique({
        where: { jogoId_jogadorId: { jogoId, jogadorId } },
      });
      if (existingStats) continue;
      await prisma.jogosEstatisticasJogador.create({
        data: { jogoId, jogadorId, gols: 1, minutosJogados: 20 },
      });
    }

    const scheduled = await prisma.campeonatosJogos.findFirst({
      where: {
        campeonatoId: campeonato.id,
        adversario: { equals: game.adversario, mode: 'insensitive' },
        data: new Date(game.data),
      },
    });
    const scheduleData = {
      campeonatoId: campeonato.id,
      data: new Date(game.data),
      horario: '20:00',
      equipe: equipe.nome,
      adversario: game.adversario,
      competicao: COMPETICAO,
      local: game.mandante ? 'Mandante' : 'Visitante',
      jogoId,
    };
    if (scheduled) {
      await prisma.campeonatosJogos.update({ where: { id: scheduled.id }, data: scheduleData });
      console.log(`   ↳ Tabela campeonato vinculada: ${game.adversario}`);
    } else {
      await prisma.campeonatosJogos.create({ data: scheduleData });
      console.log(`   ↳ Tabela campeonato criada: ${game.adversario}`);
    }

    let adv = await prisma.adversario.findFirst({
      where: { equipeId: equipe.id, nome: { equals: game.adversario, mode: 'insensitive' } },
    });

    const advData = {
      equipeId: equipe.id,
      nome: game.adversario,
      competicao: COMPETICAO,
      tecnicoNome: game.adversarioInfo.tecnicoNome,
      pontosFortes: game.adversarioInfo.pontosFortes,
      pontosFracos: game.adversarioInfo.pontosFracos,
      analiseTexto: game.adversarioInfo.analiseTexto,
      analiseAtualizadaEm: new Date(),
      videoUrl: game.videoUrl,
      observacoes: game.adversarioInfo.observacoes,
      monitorado: true,
    };

    if (adv) {
      adv = await prisma.adversario.update({ where: { id: adv.id }, data: advData });
    } else {
      adv = await prisma.adversario.create({ data: { ...advData, apelidos: [] } });
    }

    await prisma.adversarioVideo.upsert({
      where: { adversarioId_url: { adversarioId: adv.id, url: game.videoUrl } },
      create: {
        adversarioId: adv.id,
        url: game.videoUrl,
        label: `${game.adversario} — ${game.rodada} (${game.data})`,
        dataJogo: new Date(game.data),
        fonte: 'youtube-lnf',
      },
      update: {
        label: `${game.adversario} — ${game.rodada} (${game.data})`,
        dataJogo: new Date(game.data),
      },
    });
  }

  console.log('\n✅ Seed Chopinzinho concluído');
  console.log(`   Equipe ID: ${equipe.id}`);
  console.log(`   Técnico: ${tecnico.nome} | User: ${user.name}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
