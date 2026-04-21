import type { BlogPost } from './types';

export const POSTS_PT: BlogPost[] = [
  {
    slug: 'por-que-dados-no-banco',
    lang: 'pt-BR',
    title: 'Por que dados no banco importam mais do que no papel',
    date: '2026-04-12',
    readMinutes: 4,
    author: 'SCOUT21',
    keywords: ['gestão esportiva', 'scout futsal', 'dados no futebol', 'banco de dados clube'],
    excerpt:
      'Planilhas funcionam até deixarem de funcionar. Um único repositório de dados evita versões conflitantes e dá histórico à comissão técnica.',
    paragraphs: [
      'Planilhas e blocos de notas funcionam até deixarem de funcionar: alguém sobrescreve uma célula, a versão antiga circula no WhatsApp e ninguém sabe qual é a fonte da verdade. Num banco de dados, cada registo tem contexto e pode alimentar elenco, calendário e leitura pós-jogo sem recópia manual.',
      'Para o coordenador, o ganho não é «mais tecnologia», é menos retrabalho: o mesmo dado alimenta disponibilidade, preparação da semana e decisões no banco.',
      'O SCOUT21 parte desse princípio: histórico por equipa, legível para quem precisa decidir — não só para quem gosta de Excel.',
    ],
    translations: { en: 'why-database-beats-spreadsheet', es: 'por-que-datos-en-la-base' },
  },
  {
    slug: 'rotina-semana-competitiva',
    lang: 'pt-BR',
    title: 'Rotina de uma semana competitiva com elenco apertado',
    date: '2026-04-08',
    readMinutes: 5,
    author: 'SCOUT21',
    keywords: ['rotina treino futsal', 'semana competitiva', 'gestão de elenco'],
    excerpt:
      'Semana cheia é uma sequência de decisões: carga, disponibilidade e comunicação entre staff. Sem visão comum, cada um improvisa.',
    paragraphs: [
      'Semana cheia costuma ser uma sequência de decisões encadeadas: quem treina em que intensidade, quem fica em gestão de carga, quem entra no fim de semana com minutos controlados. Sem visão comum, cada membro da equipa técnica improvisa — e o atleta paga o preço da inconsistência.',
      'Uma rotina saudável combina calendário claro (jogos e treinos), estado do elenco (lesão, disponibilidade, minutos recentes) e comunicação curta entre staff.',
      'Ferramentas ajudam quando reduzem cópia de dados e mostram a mesma informação a toda a gente que decide.',
    ],
    translations: { en: 'competitive-week-routine', es: 'rutina-semana-competitiva' },
  },
  {
    slug: 'scout-alem-dos-numeros',
    lang: 'pt-BR',
    title: 'Scout além dos números: contexto que o treinador precisa',
    date: '2026-04-03',
    readMinutes: 4,
    author: 'SCOUT21',
    keywords: ['scout futsal', 'análise de jogo', 'contexto tático'],
    excerpt:
      'Estatísticas brutas são úteis, mas o treinador pergunta «em que momento?», «contra que sistema?». Contexto transforma número em decisão.',
    paragraphs: [
      'Estatísticas brutas — remates, passes, distância — são úteis, mas raramente bastam. O treinador pergunta em que momento do jogo isso aconteceu, contra que sistema rival, com que jogadores em campo.',
      'Boas equipas ligam evento a momento e jogador: não só «quantos», mas «quando e porquê».',
      'No SCOUT21, a ambição é aproximar o registo da realidade do banco: o mesmo jogo alimenta visão coletiva e leituras individuais.',
    ],
    translations: { en: 'scout-beyond-numbers', es: 'scout-mas-alla-de-los-numeros' },
  },
];
