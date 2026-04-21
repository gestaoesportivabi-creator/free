import type { BlogPost } from './types';

/**
 * Posts em português. Formato de blocos (h2/h3/p/list/quote/callout/cta-*) permite
 * renderização rica com TOC, typography profissional e CTAs inline.
 */
export const POSTS_PT: BlogPost[] = [
  {
    slug: 'por-que-dados-no-banco-importam-mais-que-no-papel',
    lang: 'pt-BR',
    title: 'Por que dados no banco importam mais do que no papel',
    subtitle:
      'Planilhas funcionam até deixarem de funcionar. Um banco único dá histórico, consistência e velocidade — e paga o investimento na primeira temporada.',
    date: '2026-04-12',
    updatedDate: '2026-04-20',
    readMinutes: 9,
    author: 'Redação SCOUT21',
    heroEmoji: '🧠',
    tags: ['gestão', 'dados', 'planilha', 'clube'],
    excerpt:
      'Planilhas funcionam até deixarem de funcionar. Um único repositório de dados evita versões conflitantes, dá histórico e profissionaliza a comissão técnica.',
    keywords: [
      'gestão de clube de futsal',
      'planilhas futsal',
      'banco de dados esportivo',
      'scout futsal',
      'análise de desempenho',
      'KPIs clube',
    ],
    translations: {
      en: 'why-database-beats-spreadsheet',
      es: 'por-que-datos-en-la-base',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Todo clube começa com uma planilha. No primeiro mês ela resolve: cadastra atleta, conta gols, soma assistências. No terceiro, começa a rachar — o preparador físico fez uma cópia, o treinador outra, o analista exportou um PDF. Na quinta jornada ninguém sabe qual é a versão “oficial” do scout. A informação existe mas não decide nada, porque não é confiável.',
      },
      { type: 'h2', text: 'O custo invisível da planilha compartilhada' },
      {
        type: 'p',
        text:
          'A dor não é o Excel. A dor é que planilhas não foram feitas para serem a fonte única de verdade de uma operação com muitas pessoas escrevendo ao mesmo tempo, em momentos diferentes, com critérios diferentes. Elas foram feitas para cálculo, não para governança de dados.',
      },
      {
        type: 'list',
        items: [
          'Sem histórico auditável: quem mudou a avaliação física do atleta? Quando? Por quê?',
          'Sem integridade referencial: um jogador pode aparecer com dois IDs diferentes e virar duas pessoas.',
          'Sem concorrência segura: dois editores ao mesmo tempo geram conflitos silenciosos.',
          'Sem consultas complexas: “me mostra todos os atletas que fizeram >3 gols contra sistema 3×1” vira um caça ao tesouro manual.',
        ],
      },
      {
        type: 'callout',
        kind: 'tip',
        title: 'Atalho mental',
        text:
          'Se a sua comissão gasta mais tempo arrumando a planilha do que lendo o que ela diz, o ROI já é negativo — mesmo que a planilha seja “gratuita”.',
      },
      { type: 'h2', text: 'O que muda com um banco único' },
      {
        type: 'p',
        text:
          'Ao centralizar scout, fisiologia, presença e calendário em um único banco de dados, o clube passa a ter três coisas que planilha nunca entrega: histórico, consistência e velocidade de consulta.',
      },
      { type: 'h3', text: 'Histórico que ninguém apaga' },
      {
        type: 'p',
        text:
          'Cada avaliação física, cada jogo, cada minuto em quadra fica registrado com carimbo de tempo e autor. Isso muda a conversa com o atleta: você deixa de argumentar por memória e passa a argumentar por série temporal — “nos últimos 5 jogos você caiu de 82% para 64% de acerto de passes sob pressão, olha aqui”.',
      },
      { type: 'h3', text: 'Consistência entre quem escreve e quem lê' },
      {
        type: 'p',
        text:
          'O treinador não escreve o mesmo nome em duas grafias, porque o sistema força a escolha do atleta cadastrado. A preparação física não cria uma terceira “tabela de FC”, porque o schema é único. O relatório gerencial pega os mesmos dados que o scout.',
      },
      { type: 'h3', text: 'Velocidade para perguntar coisas difíceis' },
      {
        type: 'p',
        text:
          'A pergunta deixa de ser “tem isso na planilha?” e passa a ser “o que eu quero saber?”. Banco de dados processa recortes em segundos — você consegue cruzar posição, adversário, sistema defensivo e momento do jogo sem abrir 5 abas.',
      },
      { type: 'cta-newsletter' },
      { type: 'h2', text: 'Quando a planilha ainda serve' },
      {
        type: 'p',
        text:
          'Não é religião. Planilha continua ótima para três coisas: rascunho, relatório pontual e prototipagem de métrica nova. O erro é fazer dela a espinha dorsal do clube. A espinha dorsal precisa ser um banco com schema explícito e permissões por papel.',
      },
      { type: 'h2', text: 'Como migrar sem parar a operação' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Liste as 5 perguntas que a comissão faz toda semana. São essas que o banco precisa responder em 10s.',
          'Modele só o mínimo: atleta, jogo, evento de scout, avaliação física. Não importe tudo de uma vez.',
          'Importe a planilha atual uma única vez e congele-a — a partir daí só o banco escreve.',
          'Crie relatórios que fechem o loop semanal: o que mudou, quem jogou menos, quem subiu de carga.',
          'Só então avance para micrométricas (quartetos, posse, fisiologia avançada).',
        ],
      },
      {
        type: 'callout',
        kind: 'info',
        title: 'O que o SCOUT 21 entrega aqui',
        text:
          'O SCOUT 21 é exatamente este banco único, com telas prontas para scout, fisiologia, calendário e relatório gerencial. Você não constrói schema: abre, cadastra o elenco e começa a registrar o primeiro jogo.',
      },
      { type: 'h2', text: 'O critério honesto de sucesso' },
      {
        type: 'p',
        text:
          'Se daqui a três meses o treinador olhar para a tela e disser “eu lembro de ter sentido isso, mas o número mostrou diferente” — a migração valeu. Porque agora o dado é mais forte que a impressão, e o clube decide com mais coragem.',
      },
      { type: 'cta-product' },
    ],
  },
  {
    slug: 'rotina-de-semana-competitiva-com-elenco-apertado',
    lang: 'pt-BR',
    title: 'Rotina de uma semana competitiva com elenco apertado',
    subtitle:
      'Semana cheia é uma sequência de decisões sob escassez. Sem visão comum entre staff, cada um improvisa — e o atleta paga a conta.',
    date: '2026-04-08',
    updatedDate: '2026-04-20',
    readMinutes: 10,
    author: 'Redação SCOUT21',
    heroEmoji: '📅',
    tags: ['rotina', 'carga', 'preparação física', 'comissão técnica'],
    excerpt:
      'Semana cheia é uma sequência de decisões: carga, disponibilidade, recuperação e comunicação. Um esqueleto bem desenhado tira o improviso da equação.',
    keywords: [
      'rotina semanal futsal',
      'gestão de carga',
      'preparação física futsal',
      'microciclo',
      'RPE',
      'semana competitiva',
    ],
    translations: {
      en: 'competitive-week-routine',
      es: 'rutina-semana-competitiva',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Elenco apertado é regra, não exceção. A comissão que vence com 12 atletas disponíveis faz a mesma coisa todas as semanas: transforma incerteza em ritmo. Este texto descreve o esqueleto que, na nossa experiência, aguenta a temporada inteira — mesmo quando aparece lesão, dor muscular e jogo viajado no meio.',
      },
      { type: 'h2', text: 'O princípio: uma semana é um sistema, não um calendário' },
      {
        type: 'p',
        text:
          'A diferença entre um clube organizado e um clube que apaga incêndio é que o primeiro sabe responder três perguntas em qualquer dia da semana: quem está disponível, em que carga e para qual finalidade. O calendário é só a projeção disso no tempo.',
      },
      { type: 'h2', text: 'O esqueleto de 7 dias' },
      { type: 'h3', text: 'Dia do jogo (D-0)' },
      {
        type: 'p',
        text:
          'Foco em ativação, reforço tático curto e decisão rápida sobre quem realmente joga. A conversa com o atleta é objetiva: sensação na escala 1–10, pontos de dor, confiança no papel tático.',
      },
      { type: 'h3', text: 'D+1 — recuperação ativa e registro honesto' },
      {
        type: 'p',
        text:
          'Todo atleta que jogou entra com RPE, duração percebida e queixas musculoesqueléticas. Essa camada de dados é o combustível do microciclo seguinte. Sem ela, o preparador físico inventa.',
      },
      { type: 'h3', text: 'D+2 — carga alta (central)' },
      {
        type: 'p',
        text:
          'Sessão mais intensa da semana em atletas que acumularam menos minutos no D-0. Os que acumularam muito fazem trabalho regenerativo ou compensatório. Essa decisão precisa ser visível pra todo staff, não só pro preparador.',
      },
      { type: 'h3', text: 'D+3 — tática específica contra o próximo adversário' },
      {
        type: 'p',
        text:
          'Scout do adversário já virou estudo: sistemas, transições, goleiro, bolas paradas. O treino tem contexto, não é “jogar padrão”. Isso eleva a qualidade percebida do treino e reduz atrito.',
      },
      { type: 'h3', text: 'D+4 — carga média, jogo reduzido, decisão real' },
      {
        type: 'p',
        text:
          'Dia de ajustar papéis. É aqui que você testa o quarteto e o goleiro-linha. O staff precisa concordar ao final sobre o rascunho da convocação.',
      },
      { type: 'h3', text: 'D-1 — ativação, bolas paradas, enxugamento' },
      {
        type: 'p',
        text:
          'Sessão curta, focada em bolas paradas e situações decisivas. O atleta termina o dia com clareza absoluta do seu papel. Dúvida em D-1 é derrota em D-0.',
      },
      { type: 'cta-newsletter' },
      { type: 'h2', text: 'Os três buracos que matam a semana' },
      {
        type: 'list',
        items: [
          'RPE que não é coletado de forma consistente vira estatística decorativa, não ferramenta de decisão.',
          'Scout do adversário que mora só na cabeça do analista não influencia o treino — e o treino perde densidade.',
          'Convocação que chega no vestiário no D-0 sem ter sido rascunhada no D+4 sempre gera ruído com o elenco.',
        ],
      },
      { type: 'h2', text: 'Comunicação: o multiplicador silencioso' },
      {
        type: 'p',
        text:
          'O pior do apertado não é o número de atletas — é a quantidade de decisões que precisam ser tomadas rapidamente. Quando todo o staff enxerga os mesmos dados (RPE, disponibilidade, histórico), a conversa vira curta. Quando cada um olha pra um lugar diferente, a reunião de 10 minutos vira 40.',
      },
      {
        type: 'callout',
        kind: 'tip',
        title: 'Ritual que vale ouro',
        text:
          'Bloqueie 15 minutos todo D+2 e D+4 com o staff inteiro olhando a mesma tela. Ponto único, decisão única, zero mensagens perdidas no WhatsApp.',
      },
      { type: 'h2', text: 'Como operacionalizar no SCOUT 21' },
      {
        type: 'list',
        items: [
          'Programação centraliza treinos e jogos com convocação e presença auditáveis.',
          'Scout coletivo alimenta o relatório do microciclo (carga percebida × minutos × eventos técnicos).',
          'Fisiologia (planos Performance/Avançado) liga RPE e avaliação à evolução do atleta.',
        ],
      },
      { type: 'cta-product' },
    ],
  },
  {
    slug: 'scout-alem-dos-numeros-contexto-para-o-treinador',
    lang: 'pt-BR',
    title: 'Scout além dos números: contexto que o treinador precisa',
    subtitle:
      'Estatística bruta responde “quanto”. Treinador precisa de “em que momento”, “contra que sistema”, “com quem em quadra”. É o contexto que transforma dado em decisão.',
    date: '2026-04-03',
    updatedDate: '2026-04-20',
    readMinutes: 8,
    author: 'Redação SCOUT21',
    heroEmoji: '🎯',
    tags: ['scout', 'análise tática', 'contexto', 'treinador'],
    excerpt:
      'Estatísticas brutas são úteis, mas o treinador pergunta «em que momento?», «contra que sistema?». Contexto transforma número em decisão.',
    keywords: [
      'scout futsal',
      'análise tática futsal',
      'contexto scout',
      'quarteto futsal',
      'transições futsal',
      'análise de jogo',
    ],
    translations: {
      en: 'scout-beyond-numbers',
      es: 'scout-mas-alla-de-los-numeros',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Dois números dizem pouco. Finalizações e gols. O primeiro pode ser um chute desesperado, o segundo um rebote feliz. Scout de alto nível não é contagem — é contexto estruturado. Esta é a diferença entre um sistema que entrega tabela e um sistema que ajuda a decidir.',
      },
      { type: 'h2', text: 'As quatro dimensões que transformam número em decisão' },
      { type: 'h3', text: '1. Momento do jogo' },
      {
        type: 'p',
        text:
          'Um gol sofrido nos últimos 3 minutos do primeiro tempo tem valor tático diferente de um gol nos primeiros 3 minutos. Isso muda treino, substituição e até cabeça do elenco. Se o scout não carimbar o minuto, você perde essa camada.',
      },
      { type: 'h3', text: '2. Sistema em quadra' },
      {
        type: 'p',
        text:
          'Mesma jogada contra 3×1 é uma coisa; contra 4×0 outra. Quando o scout registra o sistema no momento do evento, o treinador passa a ter um mapa de “onde pegamos gol” por sistema adversário. Isso pauta treino tático com foco.',
      },
      { type: 'h3', text: '3. Quarteto em quadra' },
      {
        type: 'p',
        text:
          'O desempenho é coletivo. Saber qual quarteto estava em quadra em cada evento muda a leitura: duas vezes pivô isolado, três vezes o mesmo fechador exposto. Isso vira escalação informada, não achismo.',
      },
      { type: 'h3', text: '4. Origem da bola' },
      {
        type: 'p',
        text:
          'Gol originado em transição rápida ensina algo diferente de gol em jogada ensaiada. Quando o scout marca a origem (bola parada, transição, saída de pressão, organização posicional), o mapa tático fica acionável.',
      },
      { type: 'cta-newsletter' },
      { type: 'h2', text: 'O perigo das métricas sem contexto' },
      {
        type: 'p',
        text:
          'Ranking de “quem mais finaliza” sem filtro de sistema e minuto recompensa o jogador que arrisca de longe nos momentos de menor perigo. Isso polui a conversa com o elenco e leva o treinador a insistir em soluções que não resolvem partida.',
      },
      {
        type: 'quote',
        text:
          'Número sem contexto convence mas não convence certo. O treinador que decide com contexto ganha confiança e evita o ciclo do “rodar o elenco por rodar”.',
        cite: 'Comissão técnica Sub-20, parceira SCOUT21',
      },
      { type: 'h2', text: 'Como estruturar um scout que carregue contexto' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Defina o catálogo fechado de eventos: finalização, passe, desarme, recuperação, perda, falta, bola parada, assistência, gol sofrido.',
          'Cada evento obrigatoriamente tem: minuto, quarteto em quadra, sistema próprio, sistema adversário.',
          'Eventos de risco (gol sofrido, perda em saída) exigem campo livre curto descrevendo a origem.',
          'Gere relatórios em duas visões: individual (para conversa com atleta) e coletiva (para ajuste tático).',
          'Revise o catálogo a cada 10 jogos — scout precisa evoluir com a equipe.',
        ],
      },
      {
        type: 'callout',
        kind: 'info',
        title: 'Pronto pra usar',
        text:
          'O SCOUT 21 já traz este catálogo estruturado com sistema, quarteto, bola parada, posse e scout do goleiro-linha. Você ganha contexto sem construir schema.',
      },
      { type: 'h2', text: 'Honestidade: o que dado nunca vai te dizer' },
      {
        type: 'p',
        text:
          'O dado te dá o “o quê” e parte do “por quê”. Nunca te dá o “quem está disposto a correr o risco no próximo lance”. Esse é o trabalho do treinador. Bom scout não substitui técnica: ele liberta o técnico do ruído administrativo e deixa a cabeça dele livre para o que só ele faz.',
      },
      { type: 'cta-product' },
    ],
  },
  {
    slug: 'indicadores-de-alta-performance-para-clubes-de-futsal',
    lang: 'pt-BR',
    title: 'Indicadores de alta performance: o kit mínimo para clubes de futsal',
    subtitle:
      'Você não precisa de 50 métricas. Precisa de 8 que toda comissão entende, atualizadas por jogo e atualizadas por atleta.',
    date: '2026-04-16',
    updatedDate: '2026-04-20',
    readMinutes: 8,
    author: 'Redação SCOUT21',
    heroEmoji: '📊',
    tags: ['KPIs', 'métricas', 'alta performance', 'dashboard'],
    excerpt:
      'Lista curta, brutalmente honesta, dos indicadores que decidem temporada em clubes de futsal que trabalham com poucos recursos e alta ambição.',
    keywords: [
      'KPI futsal',
      'indicadores de performance esportiva',
      'dashboard clube',
      'BI futsal',
      'métricas de gestão esportiva',
    ],
    translations: {
      en: 'high-performance-kpis-for-futsal-clubs',
      es: 'kpi-de-alto-rendimiento-para-clubes-de-futsal',
    },
    blocks: [
      {
        type: 'p',
        text:
          'A maior parte dos dashboards de clube sofre do mesmo problema: métricas demais. Gestão de alta performance é o oposto — poucos indicadores, lidos toda semana, com responsabilidade clara. Esta é a versão enxuta que usamos com clubes do nível amador sério ao profissional.',
      },
      { type: 'h2', text: 'KPIs operacionais (o chão da fábrica)' },
      { type: 'h3', text: '1. Disponibilidade do elenco (%)' },
      {
        type: 'p',
        text:
          'Atletas aptos ÷ atletas do elenco, por semana. Abaixo de 75% de disponibilidade sustentada, o planejamento tático simplesmente colapsa. É o primeiro sinal de sobrecarga ou de ruído de comunicação clínica.',
      },
      { type: 'h3', text: '2. Distribuição de minutos' },
      {
        type: 'p',
        text:
          'Minutos do top 4 vs. bottom 4 do elenco. Se a diferença passa de 3×, o clube está jogando com a metade do elenco — cansaço acumulado e frustração do banco viram resultado ruim em fim de temporada.',
      },
      { type: 'h3', text: '3. RPE médio do microciclo' },
      {
        type: 'p',
        text:
          'Percepção de esforço média entre D+1 e D-1. Abaixo de 5: treino não está desafiando. Acima de 8: você está fritando o elenco. O valor só faz sentido comparado consigo mesmo ao longo da temporada.',
      },
      { type: 'h2', text: 'KPIs táticos (a mesa do treinador)' },
      { type: 'h3', text: '4. xG próprio e xG sofrido' },
      {
        type: 'p',
        text:
          'Expected goals é a estimativa de gols esperados a partir da qualidade das finalizações. Se o clube ganha jogos com xG sofrido maior que o próprio, prepare-se: o resultado vai regredir à média em algumas rodadas.',
      },
      { type: 'h3', text: '5. Eficiência ofensiva por quarteto' },
      {
        type: 'p',
        text:
          'Gols marcados ÷ minutos do quarteto. Identifica combinações que geram chance de verdade. Cruzado com xG evita premiar sorte.',
      },
      { type: 'h3', text: '6. Retomada de bola no campo ofensivo' },
      {
        type: 'p',
        text:
          'Desarmes e recuperações no terço ofensivo por 100 possessões adversárias. É o KPI mais subestimado: times que recuperam alto criam sem precisar de jogadas ensaiadas.',
      },
      { type: 'cta-newsletter' },
      { type: 'h2', text: 'KPIs de gestão (a mesa da presidência)' },
      { type: 'h3', text: '7. Aderência ao planejamento técnico' },
      {
        type: 'p',
        text:
          'Treinos realizados ÷ treinos planejados. Abaixo de 85% sustentado, há um problema estrutural: logística, campo, escala de pessoal, ou falta de clareza do plano.',
      },
      { type: 'h3', text: '8. Tempo médio para disponibilizar dado do jogo' },
      {
        type: 'p',
        text:
          'Tempo entre o apito final e o relatório fechado no sistema. Quanto menor, mais rápido a comissão ajusta. Na prática, clube que leva >48h perde pelo menos um microciclo inteiro de decisão.',
      },
      {
        type: 'callout',
        kind: 'warn',
        title: 'Sinal vermelho',
        text:
          'Se você não consegue extrair esses 8 números em 10 minutos toda segunda-feira, você ainda não está em alta performance — independente do nome do plano que contratou.',
      },
      { type: 'h2', text: 'Como o SCOUT 21 entrega esses KPIs' },
      {
        type: 'list',
        items: [
          'Disponibilidade e distribuição de minutos: nativos no módulo Gestão de Equipe + Programação.',
          'RPE, eficiência por quarteto e retomada: módulo Scout (coletivo ampliado/completo).',
          'xG próprio e xG sofrido: plano Avançado (relatório gerencial).',
          'Aderência e tempo de fechamento: derivados da auditoria do sistema.',
        ],
      },
      { type: 'cta-product' },
    ],
  },
  {
    slug: 'como-montar-um-scout-individual-em-10-passos',
    lang: 'pt-BR',
    title: 'Como montar um scout individual de atleta em 10 passos',
    subtitle:
      'Método direto para registrar, comparar e conversar com o atleta a partir de dado — sem virar burocracia de preparador.',
    date: '2026-04-19',
    updatedDate: '2026-04-20',
    readMinutes: 7,
    author: 'Redação SCOUT21',
    heroEmoji: '🧩',
    tags: ['scout individual', 'avaliação', 'feedback', 'atleta'],
    excerpt:
      'Passo a passo prático para construir o scout individual que conversa com o atleta e sustenta decisão de comissão técnica.',
    keywords: [
      'scout individual',
      'avaliação de atleta',
      'feedback esportivo',
      'evolução de atleta',
      'gestão de performance',
    ],
    translations: {
      en: 'how-to-build-an-individual-scouting-sheet-in-10-steps',
      es: 'como-armar-un-scout-individual-en-10-pasos',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Scout individual que só mora na cabeça do analista não decide nada. Este é o processo que temos visto funcionar em clubes de futsal que querem escalar sem contratar analista para cada atleta.',
      },
      { type: 'h2', text: 'O método, explícito' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Defina o papel do atleta dentro do modelo de jogo (ex: ala-pivô que inicia a saída curta).',
          'Liste 5 comportamentos observáveis que materializam esse papel (ex: fixação do defensor, saída em diagonal, cobertura do ala oposto).',
          'Para cada comportamento, defina o evento de scout que representa (ex: “fixação bem-sucedida”).',
          'Colete esses eventos em todo jogo, por 6–8 jogos seguidos, sem exceção.',
          'Compare o atleta consigo mesmo: tendência dos últimos 3 jogos vs. histórico.',
          'Compare o atleta com a norma da posição no clube (não com o top da liga — essa referência destrói moral).',
          'Marque um 1:1 com o atleta e abra os dados juntos. O atleta vê, pergunta, discorda se quiser.',
          'Transforme o 1:1 em 2 metas comportamentais (não de resultado) para os próximos 3 jogos.',
          'Registre as metas no sistema — elas entram no próximo ciclo de avaliação.',
          'Repita. O scout individual só funciona se for rotina, nunca evento.',
        ],
      },
      { type: 'cta-newsletter' },
      { type: 'h2', text: 'O que não fazer' },
      {
        type: 'list',
        items: [
          'Não misture avaliação individual com ranking público de elenco — destrói confiança.',
          'Não compare o atleta com o protagonista da posição. Use a norma do grupo.',
          'Não use nota 1–10 sem comportamento por trás. Isso é opinião disfarçada de número.',
        ],
      },
      {
        type: 'callout',
        kind: 'tip',
        title: 'Tempo real gasto',
        text:
          'Uma comissão organizada leva ~20 minutos por atleta para preparar um 1:1 mensal. Sem um banco único, leva 2–3 horas — e é por isso que quase ninguém faz.',
      },
      { type: 'cta-product' },
    ],
  },
];
