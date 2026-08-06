/**
 * Dados de demonstração do onboarding.
 *
 * O Scout é um produto de análise: sem jogos registados, todo gráfico, ranking e
 * insight é uma caixa vazia. Um treinador que entra e vê tela vazia não consegue
 * avaliar nada — e vai embora. Popular a conta com um elenco e alguns jogos mostra
 * o produto a funcionar em segundos, e a limpeza é um clique.
 *
 * Tudo criado aqui leva `isDemo = true`, o que o exclui da métrica de ativação
 * (ver docs/PLANO_MESTRE_TRIAL_30D.md §4.4) e permite remoção em bloco.
 */

import prisma from '../config/database';

const DEMO_ROSTER = [
  { nome: 'Ricardo Alves', apelido: 'Ricardinho', numero: 1, funcao: 'Goleiro' },
  { nome: 'Bruno Cardoso', apelido: 'Bruno', numero: 2, funcao: 'Fixo' },
  { nome: 'Diego Nunes', apelido: 'Diego', numero: 3, funcao: 'Fixo' },
  { nome: 'Felipe Moreira', apelido: 'Felipão', numero: 4, funcao: 'Ala' },
  { nome: 'Lucas Ferreira', apelido: 'Lucas', numero: 5, funcao: 'Ala' },
  { nome: 'Matheus Rocha', apelido: 'Matheus', numero: 6, funcao: 'Ala' },
  { nome: 'Rafael Souza', apelido: 'Rafa', numero: 7, funcao: 'Ala' },
  { nome: 'Gabriel Lima', apelido: 'Gabi', numero: 8, funcao: 'Pivô' },
  { nome: 'Thiago Barros', apelido: 'Thiago', numero: 9, funcao: 'Pivô' },
  { nome: 'André Pinto', apelido: 'Dedé', numero: 10, funcao: 'Ala' },
  { nome: 'Vitor Campos', apelido: 'Vitinho', numero: 11, funcao: 'Fixo' },
  { nome: 'Paulo Henrique', apelido: 'PH', numero: 12, funcao: 'Goleiro' },
] as const;

const DEMO_OPPONENTS = [
  'Atlético Municipal',
  'União Futsal',
  'Clube Recreativo',
  'Associação Esportiva',
  'Grêmio Regional',
  'Sport Club Central',
] as const;

/** PRNG determinístico: a mesma equipa gera sempre a mesma demo, o que torna o suporte previsível. */
function makeRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function intBetween(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export interface DemoSeedResult {
  players: number;
  matches: number;
}

export async function seedDemoData(equipeId: string): Promise<DemoSeedResult> {
  const existing = await prisma.jogo.count({ where: { equipeId, isDemo: true } });
  if (existing > 0) {
    // Já existe demo nesta equipa — não duplicar.
    const players = await prisma.equipesJogadores.count({
      where: { equipeId, jogador: { isDemo: true } },
    });
    return { players, matches: existing };
  }

  const rand = makeRandom(equipeId);
  const today = new Date();

  return prisma.$transaction(async (tx) => {
    // 1. Elenco
    const jogadorIds: string[] = [];
    for (const entry of DEMO_ROSTER) {
      const jogador = await tx.jogador.create({
        data: {
          nome: entry.nome,
          apelido: entry.apelido,
          numeroCamisa: entry.numero,
          funcaoEmQuadra: entry.funcao,
          idade: intBetween(rand, 18, 33),
          peDominante: rand() > 0.75 ? 'Esquerdo' : 'Direito',
          isAtivo: true,
          isDemo: true,
        },
        select: { id: true },
      });

      await tx.equipesJogadores.create({
        data: {
          equipeId,
          jogadorId: jogador.id,
          dataInicio: new Date(today.getFullYear(), 0, 1),
        },
      });

      jogadorIds.push(jogador.id);
    }

    // 2. Jogos, um a cada 7 dias para trás — dá série temporal aos gráficos.
    let matches = 0;
    for (let i = 0; i < DEMO_OPPONENTS.length; i += 1) {
      const data = new Date(today.getTime() - (i + 1) * 7 * 86_400_000);
      const golsPro = intBetween(rand, 0, 6);
      const golsContra = intBetween(rand, 0, 5);
      const resultado = golsPro > golsContra ? 'V' : golsPro < golsContra ? 'D' : 'E';

      const chutesNoGol = golsPro + intBetween(rand, 3, 9);
      const chutesFora = intBetween(rand, 4, 12);
      const passesCorretos = intBetween(rand, 180, 340);
      const passesErrados = intBetween(rand, 30, 80);

      const jogo = await tx.jogo.create({
        data: {
          equipeId,
          adversario: DEMO_OPPONENTS[i],
          data,
          campeonato: 'Campeonato de Demonstração',
          local: i % 2 === 0 ? 'Casa' : 'Fora',
          resultado,
          golsPro,
          golsContra,
          status: 'encerrado',
          collectionPhase: 2,
          isDemo: true,
        },
        select: { id: true },
      });

      await tx.jogosEstatisticasEquipe.create({
        data: {
          jogoId: jogo.id,
          minutosJogados: 40,
          gols: golsPro,
          golsSofridos: golsContra,
          assistencias: Math.max(0, golsPro - intBetween(rand, 0, 1)),
          passesCorretos,
          passesErrados,
          passesErradosTransicao: intBetween(rand, 2, 12),
          desarmesComBola: intBetween(rand, 5, 18),
          desarmesSemBola: intBetween(rand, 4, 15),
          desarmesContraAtaque: intBetween(rand, 1, 6),
          chutesNoGol,
          chutesFora,
          cartoesAmarelos: intBetween(rand, 0, 3),
          cartoesVermelhos: rand() > 0.9 ? 1 : 0,
          golsMarcadosJogoAberto: Math.max(0, golsPro - intBetween(rand, 0, 2)),
          golsMarcadosBolaParada: Math.min(golsPro, intBetween(rand, 0, 2)),
          golsSofridosJogoAberto: Math.max(0, golsContra - intBetween(rand, 0, 2)),
          golsSofridosBolaParada: Math.min(golsContra, intBetween(rand, 0, 2)),
        },
      });

      // Distribui os gols do jogo entre os atletas de linha, para o ranking fazer sentido.
      let golsRestantes = golsPro;
      const linha = jogadorIds.slice(1, 11);

      for (const jogadorId of jogadorIds) {
        const isLinha = linha.includes(jogadorId);
        const gols = isLinha && golsRestantes > 0 && rand() > 0.55
          ? Math.min(golsRestantes, intBetween(rand, 1, 2))
          : 0;
        golsRestantes -= gols;

        await tx.jogosEstatisticasJogador.create({
          data: {
            jogoId: jogo.id,
            jogadorId,
            minutosJogados: intBetween(rand, 12, 40),
            gols,
            assistencias: isLinha && rand() > 0.7 ? 1 : 0,
            passesCorretos: intBetween(rand, 12, 45),
            passesErrados: intBetween(rand, 2, 12),
            desarmesComBola: intBetween(rand, 0, 5),
            desarmesSemBola: intBetween(rand, 0, 4),
            chutesNoGol: isLinha ? intBetween(rand, 0, 4) : 0,
            chutesFora: isLinha ? intBetween(rand, 0, 3) : 0,
            cartoesAmarelos: rand() > 0.85 ? 1 : 0,
          },
        });
      }

      matches += 1;
    }

    return { players: jogadorIds.length, matches };
  }, { timeout: 30_000 });
}

export async function clearDemoData(equipeId: string): Promise<DemoSeedResult> {
  const [jogos, vinculos] = await Promise.all([
    prisma.jogo.findMany({ where: { equipeId, isDemo: true }, select: { id: true } }),
    prisma.equipesJogadores.findMany({
      where: { equipeId, jogador: { isDemo: true } },
      select: { jogadorId: true },
    }),
  ]);

  const jogoIds = jogos.map((j) => j.id);
  const jogadorIds = vinculos.map((v) => v.jogadorId);

  await prisma.$transaction(async (tx) => {
    // Estatísticas e eventos caem por cascade do Jogo, mas apagamos explicitamente
    // as do jogador para não deixar órfãos ligados a jogos reais.
    if (jogadorIds.length > 0) {
      await tx.jogosEstatisticasJogador.deleteMany({ where: { jogadorId: { in: jogadorIds } } });
      await tx.jogosEventos.deleteMany({ where: { jogadorId: { in: jogadorIds } } });
      await tx.equipesJogadores.deleteMany({ where: { jogadorId: { in: jogadorIds } } });
    }

    if (jogoIds.length > 0) {
      await tx.jogo.deleteMany({ where: { id: { in: jogoIds } } });
    }

    if (jogadorIds.length > 0) {
      await tx.jogador.deleteMany({ where: { id: { in: jogadorIds }, isDemo: true } });
    }
  }, { timeout: 30_000 });

  return { players: jogadorIds.length, matches: jogoIds.length };
}
