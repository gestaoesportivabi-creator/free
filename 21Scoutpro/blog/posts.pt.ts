import type { BlogPost } from './types';

/**
 * Posts em português. Formato de blocos (h2/h3/p/list/quote/callout/cta-*) permite
 * renderização rica com TOC, typography profissional e CTAs inline.
 */
export const POSTS_PT: BlogPost[] = [
  {
    slug: 'por-que-dados-no-banco-importam-mais-que-no-papel',
    lang: 'pt-BR',
    title: 'Por que dados no banco valem mais do que qualquer planilha no futsal',
    subtitle:
      'Planilha ajuda no começo. Depois vira ruído, retrabalho e versão conflitante. Um banco único devolve confiança para a comissão técnica decidir melhor.',
    date: '2026-04-12',
    updatedDate: '2026-04-20',
    readMinutes: 9,
    author: 'Redação SCOUT21',
    heroEmoji: '🧠',
    tags: ['gestão', 'dados', 'planilha', 'clube'],
    excerpt:
      'Quando scout, presença, calendário e avaliação vivem em arquivos soltos, o clube perde tempo e clareza. Um banco único transforma dado espalhado em decisão utilizável.',
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
    coverImage: '/blog-covers/por-que-dados-no-banco-importam-mais-que-no-papel.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'AS Photography',
      photographerUrl: 'https://www.pexels.com/@asphotography',
      photoUrl: 'https://www.pexels.com/photo/black-samsung-tablet-computer-106344/',
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
    title: 'Como organizar uma semana competitiva com elenco curto',
    subtitle:
      'Quando o elenco é curto, improviso custa caro. A semana precisa de ritmo, visibilidade e decisões compartilhadas entre treinador, analista e preparação física.',
    date: '2026-04-08',
    updatedDate: '2026-04-20',
    readMinutes: 10,
    author: 'Redação SCOUT21',
    heroEmoji: '📅',
    tags: ['rotina', 'carga', 'preparação física', 'comissão técnica'],
    excerpt:
      'Carga, recuperação, convocação e comunicação precisam morar no mesmo fluxo. Um microciclo bem desenhado reduz atrito e protege o rendimento do elenco.',
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
    coverImage: '/blog-covers/rotina-de-semana-competitiva-com-elenco-apertado.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Md Jawadur Rahman',
      photographerUrl: 'https://www.pexels.com/@srijonism',
      photoUrl: 'https://www.pexels.com/photo/men-playing-football-indoors-15818644/',
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
    title: 'Scout além dos números: o contexto que o treinador realmente usa',
    subtitle:
      'Número cru responde pouco. Treinador quer saber quando, contra qual sistema, com qual quarteto e em que tipo de posse o lance aconteceu.',
    date: '2026-04-03',
    updatedDate: '2026-04-20',
    readMinutes: 8,
    author: 'Redação SCOUT21',
    heroEmoji: '🎯',
    tags: ['scout', 'análise tática', 'contexto', 'treinador'],
    excerpt:
      'Scout de verdade não é só contagem. É evento com minuto, sistema, quarteto e origem da jogada para a comissão ajustar treino, leitura e escalação.',
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
    coverImage: '/blog-covers/scout-alem-dos-numeros-contexto-para-o-treinador.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Franco Monsalvo',
      photographerUrl: 'https://www.pexels.com/@franco-monsalvo-252430633',
      photoUrl: 'https://www.pexels.com/photo/soccer-coaches-discussing-strategy-outdoors-32101180/',
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
    title: 'Indicadores de alta performance no futsal: o kit mínimo da comissão',
    subtitle:
      'Dashboard não precisa impressionar. Precisa responder rápido. O kit mínimo certo ajuda treinador, coordenação e presidência a enxergarem a mesma realidade.',
    date: '2026-04-16',
    updatedDate: '2026-04-20',
    readMinutes: 8,
    author: 'Redação SCOUT21',
    heroEmoji: '📊',
    tags: ['KPIs', 'métricas', 'alta performance', 'dashboard'],
    excerpt:
      'Poucas métricas, lidas toda semana, com responsabilidade clara. Este é o conjunto que mais ajuda clubes de futsal a decidir sem se perder em painel bonito.',
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
    coverImage: '/blog-covers/indicadores-de-alta-performance-para-clubes-de-futsal.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Ketut Subiyanto',
      photographerUrl: 'https://www.pexels.com/@ketut-subiyanto',
      photoUrl: 'https://www.pexels.com/photo/man-setting-smartwatch-before-exercise-5037319/',
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
    title: 'Scout individual no futsal: como transformar observação em plano de evolução',
    subtitle:
      'O scout individual só vira ferramenta quando ajuda a conversar melhor com o atleta e gerar metas claras. Sem isso, ele vira arquivo morto.',
    date: '2026-04-19',
    updatedDate: '2026-04-20',
    readMinutes: 7,
    author: 'Redação SCOUT21',
    heroEmoji: '🧩',
    tags: ['scout individual', 'avaliação', 'feedback', 'atleta'],
    excerpt:
      'Um método simples para transformar observação dispersa em histórico, comparação e feedback útil para atleta, treinador e comissão técnica.',
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
    coverImage: '/blog-covers/como-montar-um-scout-individual-em-10-passos.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Anastasia  Shuraeva',
      photographerUrl: 'https://www.pexels.com/@anastasia-shuraeva',
      photoUrl: 'https://www.pexels.com/photo/group-of-women-playing-football-9442068/',
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
  {
    slug: 'gestao-de-equipe-no-futsal-como-parar-de-gerir-no-grupo',
    lang: 'pt-BR',
    title: 'Gestão de equipe no futsal: como parar de gerir elenco no grupo e no caderno',
    subtitle:
      'Elenco, presença, minutos, status físico e comunicação não podem viver em cinco lugares diferentes. Gestão boa começa quando todos olham para a mesma base.',
    date: '2026-04-21',
    updatedDate: '2026-04-21',
    readMinutes: 9,
    author: 'Redação SCOUT21',
    heroEmoji: '👥',
    tags: ['gestão de equipe', 'elenco', 'disponibilidade', 'organização'],
    excerpt:
      'A maior parte dos clubes perde clareza antes de perder performance. Quando o elenco é gerido no grupo, na planilha e na memória, o staff trabalha sem uma visão única.',
    keywords: [
      'gestão de equipe futsal',
      'controle de elenco futsal',
      'software para clube de futsal',
      'organização de comissão técnica',
      'gestão esportiva futsal',
    ],
    translations: {
      en: 'team-management-futsal-stop-running-it-from-whatsapp',
      es: 'gestion-de-equipo-futsal-sin-grupo-de-whatsapp',
    },
    coverImage: '/blog-covers/gestao-de-equipe-no-futsal-como-parar-de-gerir-no-grupo.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'César O\'neill',
      photographerUrl: 'https://www.pexels.com/@cesar-o-neill-26650613',
      photoUrl: 'https://www.pexels.com/photo/team-unity-celebrated-in-pre-game-huddle-29811412/',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Toda comissão técnica conhece a cena: o treinador pergunta quem está apto, o preparador físico responde “quase todos”, o analista lembra que dois atletas saíram mais cedo no treino anterior, e a coordenação descobre em cima da hora que um terceiro não vai chegar. Não falta esforço. Falta uma fonte única de verdade.',
      },
      { type: 'h2', text: 'O problema não é comunicação. É fragmentação.' },
      {
        type: 'p',
        text:
          'Grupo de WhatsApp serve para velocidade, não para governança. Caderno serve para memória local, não para histórico compartilhado. Planilha serve para cálculo, não para operação viva. Quando elenco, presença, disponibilidade e observações ficam separados, o clube passa a tomar decisão por sensação.',
      },
      {
        type: 'list',
        items: [
          'A coordenação vê uma versão do elenco; o treinador, outra.',
          'Presença no treino não conversa com minutos do jogo.',
          'Status físico é relatado de forma solta, sem histórico comparável.',
          'A ausência de um atleta vira surpresa, não dado processado.',
        ],
      },
      { type: 'h2', text: 'O que uma gestão de equipe bem feita precisa mostrar' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Quem faz parte do elenco hoje, com cadastro limpo e papel claro.',
          'Quem esteve presente em cada treino, jogo ou reunião.',
          'Quem está disponível, com restrição ou fora da sessão.',
          'Qual atleta está acumulando mais minutos e carga.',
          'Que observações importam para a próxima decisão da comissão.',
        ],
      },
      { type: 'h2', text: 'Como isso aparece na prática no SCOUT 21' },
      {
        type: 'p',
        text:
          'No módulo de Gestão de Equipe, o clube centraliza elenco, presença, programação e histórico operacional no mesmo ambiente. Isso não é detalhe administrativo: é a base para montar convocação, organizar microciclo, distribuir minutos e evitar ruído entre staff.',
      },
      {
        type: 'callout',
        kind: 'info',
        title: 'Tradução prática',
        text:
          'Quando a gestão de equipe está redonda, a comissão gasta menos energia lembrando o que aconteceu e mais energia escolhendo o que fazer a seguir.',
      },
      { type: 'cta-newsletter', text: 'Quer ver exemplos reais de organização de comissão técnica no futsal?' },
      { type: 'h2', text: 'O ganho não é só ordem. É velocidade de decisão.' },
      {
        type: 'p',
        text:
          'Clubes pequenos e médios não têm luxo para perder uma tarde inteira consolidando informação antes de um jogo. Quanto mais centralizada a gestão, mais rápido o staff fecha a semana, convoca melhor e chega no jogo com menos improviso.',
      },
      { type: 'cta-product', text: 'Conheça a base operacional do SCOUT 21 para gerir elenco sem depender de planilha solta.' },
    ],
  },
  {
    slug: 'seo-local-para-clubes-de-futsal-como-ser-encontrado-no-google',
    lang: 'pt-BR',
    title: 'SEO local para clubes de futsal: como ser encontrado no Google',
    subtitle:
      'A maioria dos clubes de futsal nem aparece no Google Maps quando pais procuram por opções perto de casa. Com ajustes simples de SEO local, seu clube pode dominar as buscas regionais e atrair mais atletas sem gastar com anúncios.',
    date: '2026-04-22',
    updatedDate: '2026-04-22',
    readMinutes: 10,
    author: 'Redação SCOUT21',
    heroEmoji: '🔍',
    tags: ['SEO local', 'marketing esportivo', 'google my business', 'futebol de salão'],
    excerpt:
      'Clubes de futsal que investem em otimização para mecanismos de busca locais veem aumento de 300% nas consultas orgânicas em até 3 meses. Este guia prático mostra como configurar seu perfil, obter avaliações e otimizar seu site para ser encontrado por pais e atletas na sua região.',
    keywords: [
      'SEO local para clubes',
      'futebol de salão google',
      'clubes futsal perto de mim',
      'otimização site esportivo',
      'google my business futsal',
    ],
    translations: {
      en: 'local-seo-for-futsal-clubs-how-to-be-found-on-google',
      es: 'seo-local-para-clubes-de-futsal-como-ser-encontrado-en-google',
    },
    coverImage: '/blog-covers/seo-local-para-clubes-de-futsal-como-ser-encontrado-no-google.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Mikhail Nilov',
      photographerUrl: 'https://www.pexels.com/@mikhailnilov',
      photoUrl: 'https://www.pexels.com/photo/top-view-football-football-stadium-1810162/',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Quando um pai procura por "clube de futsal perto de mim" ou "escolinha de futebol de salão", ele espera encontrar opções relevantes nos primeiros resultados do Google. Porém, muitos clubes esportivos nem aparecem no Google Maps, muito menos nos resultados orgânicos de busca.',
      },
      {
        type: 'h2',
        text: 'Por que o SEO local é crucial para clubes de futsal',
      },
      {
        type: 'p',
        text:
          'Diferente de negócios que atendem a nível nacional ou internacional, clubes de futsal têm público hiperlocal: pais e atletas que residem a poucos quilômetros de distância. Aparecer nas buscas locais não é apenas sobre visibilidade — é sobre acessibilidade e conveniência para seu público-alvo.',
      },
      {
        type: 'list',
        items: [
          '76% das pessoas que fazem uma busca local visitam um estabelecimento dentro de 24 horas',
          '28% das buscas locais resultam em uma compra ou matrícula',
          'Clubes com perfil completo no Google Maps recebem 7x mais cliques que perfis incompletos',
        ],
      },
      {
        type: 'h2',
        text: 'Passo a passo: configurando seu perfil no Google Meu Negócio',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          'Crie ou reivindique seu perfil no Google Meu Negócio (business.google.com)',
          'Preencha todas as informações: nome completo, endereço, telefone, website e horários',
          'Selecione categorias relevantes como "Clube de esportes", "Escolinha de futebol" e "Academia de esportes"',
          'Adiciona fotos de alta qualidade das instalações, treinamentos e eventos',
          'Incentiva pais e atletas a deixarem avaliações após cada aula ou jogo',
          'Responde a todas as avaliações, tanto positivas quanto negativas, de forma profissional',
          'Publica atualizações semanais sobre atividades, resultados e inscrições abertas',
        ],
      },
      {
        type: 'h2',
        text: 'Otimizando seu site para buscas locais',
      },
      {
        type: 'p',
        text:
          'Além do Google Meu Negócio, seu site precisa estar otimizado para que o Google entenda sua localização e relevância para buscas regionais.',
      },
      {
        type: 'list',
        items: [
          'Inclua o nome da sua cidade e região nos títulos das páginas (title tags)',
          'Adicione seu endereço completo no rodapé de todas as páginas',
          'Crie páginas específicas para cada modalidade ou categoria de idade que oferece',
          'Use marcação estruturada (schema.org) para destacar informações do clube',
          'Garanta que seu site seja mobile-friendly, já que mais de 60% das buscas locais vem de smartphones',
          'Inclua palavras-chave locais naturalmente no conteúdo, como "futsal em [sua cidade]"',
        ],
      },
      {
        type: 'h2',
        text: 'Construindo autoridade através de citações locais',
      },
      {
        type: 'p',
        text:
          'Citações são menções ao nome, endereço e telefone do seu clube em outros sites, mesmo que não incluam um link direto para seu site.',
      },
      {
        type: 'list',
        items: [
          'Cadastre seu clube em diretórios locais de esportes e recreação',
          'Garanta consistência total nas informações (NAP: Name, Address, Phone) em todos os cadastros',
          'Procure por parcerias com escolas, academias e lojas de artigos esportivos locais',
          'Participação em eventos comunitários costuma gerar menções em sites de notícias locais',
          'Monitore e corrige qualquer informação inconsistente que encontrar online',
        ],
      },
      {
        type: 'h2',
        text: 'A importância das avaliações online',
      },
      {
        type: 'p',
        text:
          'Avaliações são um dos fatores mais importantes para classificação em buscas locais e influenciam diretamente a decisão de pais em potencial.',
      },
      {
        type: 'list',
        items: [
          'Peça avaliações logo após aulas experimentais ou jogos importantes',
          'Responda sempre às avaliações, agrando pelo feedback positivo e abordando construtivamente quaisquer críticas',
          'Never ofereça incentivos em troca de avaliações, pois isso viola as diretrizes do Google e pode resultar em penalização',
          'Use feedback negativo como oportunidade para melhorar seus serviços e mostre que você se importa com a experiência dos clientes',
        ],
      },
      {
        type: 'h2',
        text: 'Medindo resultados e ajustando sua estratégia',
      },
      {
        type: 'list',
        items: [
          'Monitore suas classificações para termos como "futsal [sua cidade]" e "escolinha de futebol de salão [região]"',
          'Use o Google Analytics para ver quanto tráfego vem de buscas locais',
          'Acompanhe o aumento de ligações e mensagens provenientes do seu perfil no Google Maps',
          'Ajuste sua estratégia a cada trimestre com base nos dados coletados',
          'Lembre-se: SEO local é um processo contínuo, não uma tarefa única',
        ],
      },
      {
        type: 'cta-newsletter',
        text: 'Receba mais dicas práticas de marketing esportivo para crescimento do seu clube',
      },
      {
        type: 'h2',
        text: 'Começando hoje: ações imediatas para melhorar sua visibilidade local',
      },
      {
        type: 'list',
        items: [
          'Hoje: reivindique e complete seu perfil no Google Meu Negócio',
          'Esta semana: tire 20 fotos de qualidade das suas instalações e treinos',
          'Este mês: peça avaliações para 10 pais satisfeitos e responda a cada uma',
          'Próximos meses: monitore seus resultados e expanda para diretórios locais relevantes',
        ],
      },
      {
        type: 'cta-product',
        text: 'Quer ver como o SCOUT 21 pode ajudar na gestão e divulgação do seu clube?',
      },
    ],
  },
  {
    slug: 'programacao-semanal-de-treinos-e-jogos-sem-whatsapp',
    lang: 'pt-BR',
    title: 'Programação semanal de treinos e jogos: como organizar a semana sem depender do WhatsApp',
    subtitle:
      'A semana de um clube muda rápido demais para morar só em mensagem. Programação boa precisa ser visível, atualizável e conectada à realidade do elenco.',
    date: '2026-04-21',
    updatedDate: '2026-04-21',
    readMinutes: 8,
    author: 'Redação SCOUT21',
    heroEmoji: '🗓️',
    tags: ['programação', 'treinos', 'jogos', 'microciclo'],
    excerpt:
      'Programação não é só agenda. É a espinha dorsal da semana. Quando ela não está clara, todo o resto da operação vira mensagem perdida e decisão reativa.',
    keywords: [
      'programação semanal futsal',
      'agenda de treinos futsal',
      'organização de jogos futsal',
      'software programação esportiva',
      'microciclo futsal',
    ],
    translations: {
      en: 'weekly-planning-trainings-matches-without-whatsapp',
      es: 'programacion-semanal-entrenamientos-y-partidos-sin-whatsapp',
    },
    coverImage: '/blog-covers/programacao-semanal-de-treinos-e-jogos-sem-whatsapp.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Matheus Bertelli',
      photographerUrl: 'https://www.pexels.com/@bertellifotografia',
      photoUrl: 'https://www.pexels.com/photo/2025-desk-calendar-with-coffee-and-succulent-29509456/',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Muita comissão técnica acredita que programação é “colocar treino no calendário”. Não é. Programar bem significa ligar sessão, objetivo, presença, convocação e contexto competitivo. Quando isso não acontece, a semana até existe no papel, mas não governa ninguém.',
      },
      { type: 'h2', text: 'O que normalmente quebra a programação' },
      {
        type: 'list',
        items: [
          'Mudança de horário que não chega igual para todo mundo.',
          'Treino registrado sem deixar claro o objetivo daquela sessão.',
          'Convocação fechada fora da programação, em outro canal.',
          'Comissão olhando para agendas diferentes.',
        ],
      },
      { type: 'h2', text: 'Programação boa responde 4 perguntas' },
      {
        type: 'list',
        ordered: true,
        items: [
          'O que vai acontecer hoje?',
          'Quem precisa estar aqui?',
          'Qual é o objetivo técnico, físico ou tático da sessão?',
          'O que essa sessão muda para o jogo seguinte?',
        ],
      },
      {
        type: 'p',
        text:
          'Se a programação não responde isso com clareza para treinador, preparador, atleta e coordenação, ela é só uma agenda bonita. E agenda bonita não ganha jogo.',
      },
      { type: 'h2', text: 'Como o módulo Programação ajuda a comissão' },
      {
        type: 'p',
        text:
          'No SCOUT 21, a Programação não vive isolada. Ela conversa com presença, elenco e rotina competitiva. Isso permite transformar a semana em processo auditável: quem foi, o que foi feito, o que mudou e qual é a próxima decisão.',
      },
      {
        type: 'callout',
        kind: 'tip',
        title: 'Boa prática',
        text:
          'Se todo D+2 e D+4 o staff olha a mesma programação atualizada, a reunião fica objetiva. Quando cada um traz sua versão, a semana perde nitidez.',
      },
      { type: 'cta-newsletter', text: 'Receba mais textos práticos sobre rotina competitiva e organização de staff.' },
      { type: 'h2', text: 'Organização é vantagem competitiva' },
      {
        type: 'p',
        text:
          'Em clubes com orçamento apertado, organização vira performance. A programação certa não substitui a qualidade do treino, mas protege essa qualidade de ruídos evitáveis. É uma das maneiras mais baratas de melhorar a operação.',
      },
      { type: 'cta-product', text: 'Veja como o SCOUT 21 ajuda a organizar a semana inteira em um fluxo único.' },
    ],
  },
  {
    slug: 'relatorio-gerencial-no-futsal-o-que-a-presidencia-precisa-ver',
    lang: 'pt-BR',
    title: 'Relatório gerencial no futsal: o que a presidência precisa ver sem sufocar a comissão',
    subtitle:
      'Presidência e coordenação não precisam de 40 abas. Precisam de poucos sinais confiáveis sobre disponibilidade, carga, desempenho e andamento da operação.',
    date: '2026-04-21',
    updatedDate: '2026-04-21',
    readMinutes: 8,
    author: 'Redação SCOUT21',
    heroEmoji: '📄',
    tags: ['relatório gerencial', 'presidência', 'coordenação', 'dashboard'],
    excerpt:
      'Relatório gerencial bom não fiscaliza a comissão: reduz ruído entre quem executa no dia a dia e quem precisa enxergar a saúde esportiva do clube.',
    keywords: [
      'relatório gerencial futsal',
      'dashboard presidência clube',
      'indicadores gestão esportiva',
      'coordenação esportiva futsal',
      'BI para clubes',
    ],
    translations: {
      en: 'management-report-for-futsal-what-the-board-needs',
      es: 'informe-gerencial-futsal-que-necesita-la-directiva',
    },
    coverImage: '/blog-covers/relatorio-gerencial-no-futsal-o-que-a-presidencia-precisa-ver.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'RDNE Stock project',
      photographerUrl: 'https://www.pexels.com/@rdne',
      photoUrl: 'https://www.pexels.com/photo/person-holding-white-printer-paper-7580792/',
    },
    blocks: [
      {
        type: 'p',
        text:
          'O atrito entre comissão e gestão quase nunca nasce de má vontade. Nasce de falta de visibilidade. A presidência quer entender o que está acontecendo. A comissão quer trabalhar sem ter que reconstruir a semana inteira em PDF toda segunda-feira.',
      },
      { type: 'h2', text: 'O erro comum: relatório demais, utilidade de menos' },
      {
        type: 'p',
        text:
          'Muitos clubes produzem relatórios longos, bonitos e quase inúteis. Têm cor, gráfico e texto, mas não ajudam a responder o essencial: o elenco está disponível? a carga está coerente? o desempenho está sustentado? a operação está fechando no prazo?',
      },
      {
        type: 'list',
        items: [
          'Disponibilidade do elenco por ciclo.',
          'Distribuição de minutos e concentração de carga.',
          'Tendência de desempenho coletivo e individual.',
          'Aderência ao planejamento semanal.',
          'Tempo para fechar o dado depois do jogo.',
        ],
      },
      { type: 'h2', text: 'O papel do relatório gerencial no SCOUT 21' },
      {
        type: 'p',
        text:
          'O módulo de Relatório Gerencial existe para encurtar a distância entre operação e gestão. Ele organiza os sinais que importam sem obrigar a comissão a “montar um dossiê” toda vez que alguém pergunta como está o time.',
      },
      { type: 'h2', text: 'Quando o relatório é bom, a conversa melhora' },
      {
        type: 'p',
        text:
          'A presidência deixa de cobrar por sensação. A comissão deixa de se defender no escuro. E a coordenação passa a ter uma visão mais limpa do que precisa ser corrigido: rotina, carga, processo ou performance.',
      },
      {
        type: 'quote',
        text:
          'Relatório gerencial não é para vigiar o treino. É para evitar que a gestão tome decisão sem ver a realidade esportiva.',
        cite: 'Princípio editorial SCOUT21',
      },
      { type: 'cta-newsletter', text: 'Quer receber mais conteúdos sobre gestão esportiva orientada por dado?' },
      { type: 'h2', text: 'Menos PowerPoint, mais clareza' },
      {
        type: 'p',
        text:
          'No fim, o bom relatório é aquele que poupa tempo de todos. Se ele exige consolidação manual, captura de tela e explicação paralela toda semana, ele não está resolvendo a operação. Está criando mais uma camada de trabalho.',
      },
      { type: 'cta-product', text: 'Conheça o Relatório Gerencial do SCOUT 21 e reduza o atrito entre gestão e comissão.' },
    ],
  },
  {
    slug: 'monitoramento-fisiologico-no-futsal-com-pse-psr-e-bem-estar',
    lang: 'pt-BR',
    title: 'Monitoramento fisiológico no futsal: como usar PSE, PSR e bem-estar sem inflar a operação',
    subtitle:
      'Fisiologia não precisa virar burocracia para funcionar. O segredo é coletar pouco, coletar bem e ligar esses sinais ao que a comissão realmente decide.',
    date: '2026-04-21',
    updatedDate: '2026-04-21',
    readMinutes: 9,
    author: 'Redação SCOUT21',
    heroEmoji: '❤️',
    tags: ['fisiologia', 'PSE', 'PSR', 'bem-estar'],
    excerpt:
      'PSE, PSR, bem-estar diário e avaliação física só valem a pena quando entram no fluxo da comissão. Caso contrário, viram formulário sem consequência.',
    keywords: [
      'monitoramento fisiológico futsal',
      'PSE futsal',
      'PSR futsal',
      'bem-estar diário atleta',
      'avaliação física futsal',
    ],
    translations: {
      en: 'physiological-monitoring-futsal-rpe-psr-wellness',
      es: 'monitoreo-fisiologico-futsal-con-pse-psr-y-bienestar',
    },
    coverImage: '/blog-covers/monitoramento-fisiologico-no-futsal-com-pse-psr-e-bem-estar.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'VO2 Master',
      photographerUrl: 'https://www.pexels.com/@vo2-master-1061578389',
      photoUrl: 'https://www.pexels.com/photo/man-with-training-date-on-tablet-20523364/',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Coletar dado fisiológico é fácil. Difícil é fazer esse dado entrar na conversa da comissão. É por isso que tantos clubes abandonam a prática depois de algumas semanas: preenchem formulário, exportam planilha, mas a decisão continua sendo tomada “no olho”.',
      },
      { type: 'h2', text: 'O mínimo que já muda a rotina' },
      {
        type: 'list',
        items: [
          'PSE de treino e jogo para enxergar carga percebida.',
          'PSR para leitura de recuperação.',
          'Bem-estar diário para sinalizar fadiga e sono.',
          'Avaliação física periódica para contexto de evolução.',
        ],
      },
      {
        type: 'p',
        text:
          'Isolados, esses números são fracos. Juntos, contam uma história operacional: quem está acumulando fadiga, quem tolera bem o microciclo, quem precisa de ajuste antes do problema aparecer no jogo.',
      },
      { type: 'h2', text: 'Onde os clubes se perdem' },
      {
        type: 'list',
        items: [
          'Coletam demais e ninguém analisa.',
          'Coletam bem, mas o treinador não vê.',
          'Veem, mas não cruzam com presença, minutos e scout.',
          'Só olham o dado quando o atleta já caiu de rendimento.',
        ],
      },
      { type: 'h2', text: 'Como a fisiologia conversa com o SCOUT 21' },
      {
        type: 'p',
        text:
          'O módulo de Fisiologia do SCOUT 21 organiza Monitoramento Fisiológico, PSE, PSR, Bem-Estar Diário e Avaliação Física no mesmo ecossistema da gestão e do scout. Isso encurta a distância entre coleta e ação.',
      },
      {
        type: 'callout',
        kind: 'warn',
        title: 'Sinal de alerta',
        text:
          'Se o atleta responde o formulário, mas ninguém muda nada a partir dele, o processo está comunicando desorganização, não cuidado.',
      },
      { type: 'cta-newsletter', text: 'Assine a newsletter para receber textos práticos sobre fisiologia e rotina competitiva.' },
      { type: 'h2', text: 'Fisiologia útil é fisiologia integrada' },
      {
        type: 'p',
        text:
          'O melhor cenário não é ter mais dado. É ter dado suficiente, bem coletado, dentro da mesma conversa da comissão. Quando a fisiologia entra no fluxo diário, o clube protege melhor a carga, comunica melhor o cuidado e reduz decisão no escuro.',
      },
      { type: 'cta-product', text: 'Veja como o módulo de Fisiologia do SCOUT 21 ajuda a transformar coleta em decisão.' },
    ],
  },
  {
    slug: 'ciclo-de-feedback-scout-treino-72h-futsal',
    lang: 'pt-BR',
    title: 'O ciclo de 72h entre scout e treino: como encurtar a distância entre observar e corrigir',
    subtitle:
      'Scout que fica parado em relatório é só descrição. Scout que vira correção no treino da semana é decisão. O ciclo de 72h conecta os dois.',
    date: '2026-04-22',
    updatedDate: '2026-04-22',
    readMinutes: 8,
    author: 'Redação SCOUT21',
    heroEmoji: '🔁',
    tags: ['scout', 'treino', 'metodologia', 'feedback'],
    excerpt:
      'A maioria dos clubes coleta scout e devolve feedback tarde demais — na próxima semana, no próximo ciclo, na próxima entrevista. Quando o dado chega depois da memória do jogo, perde força. Um ciclo de 72 horas resolve isso.',
    keywords: [
      'ciclo de feedback futsal',
      'scout e treino futsal',
      'metodologia de treino futsal',
      'pós-jogo futsal',
      'correção tática futsal',
      'microciclo competitivo',
    ],
    translations: {
      en: 'scout-training-feedback-loop-72h-futsal',
      es: 'ciclo-de-feedback-scout-entrenamiento-72h-futsal',
    },
    coverImage: '/blog-covers/ciclo-de-feedback-scout-treino-72h-futsal.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Franco Monsalvo',
      photographerUrl: 'https://www.pexels.com/@franco-monsalvo-252430633',
      photoUrl: 'https://www.pexels.com/photo/soccer-coaches-discussing-strategy-outdoors-32101180/',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Todo clube sabe que precisa fazer scout. Menos clubes sabem o que acontece depois. O relatório sai pronto, circula no grupo da comissão, eventualmente vira uma conversa com o elenco — mas, na maioria das vezes, o treino da semana seguinte já foi planejado sem ele. O scout descreve o passado, o treino olha para o futuro, e raramente os dois se encontram no lugar onde deveriam: no campo, na terça-feira.',
      },
      { type: 'h2', text: 'Por que a janela curta importa' },
      {
        type: 'p',
        text:
          'A memória dos atletas sobre o jogo decai rápido. Passados três dias, o corpo já processou a carga, a cabeça já passou para a próxima adversária, e aquela imagem exata de como o bloqueio foi rompido ou de como a marcação por zona falhou começa a virar abstração. Se a correção entra no treino depois disso, ela compete com o que está prestes a acontecer — e perde.',
      },
      {
        type: 'callout',
        kind: 'info',
        title: 'Regra prática',
        text:
          'O scout só gera adaptação técnica real se for devolvido ao elenco antes do terceiro treino pós-jogo. Depois disso, a correção concorre com a preparação do próximo adversário.',
      },
      { type: 'h2', text: 'O desenho das 72 horas' },
      {
        type: 'p',
        text:
          'O ciclo não é complicado. O que custa é a disciplina de cumprir os três cortes, sem furar. Cada janela tem um objetivo claro, um responsável e um artefato que precisa existir ao final.',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          '0–24h: scout técnico-tático consolidado, com os três a cinco pontos mais importantes para o grupo, não a lista exaustiva de eventos.',
          '24–48h: conversa em bloco com o elenco — vídeo curto, linguagem do treinador, foco no padrão, não no erro individual.',
          '48–72h: primeiro treino com ajuste aplicado, desenho em situação real, variação de pressão que reproduza o cenário problemático do jogo.',
        ],
      },
      { type: 'h2', text: 'O que destrói o ciclo na prática' },
      {
        type: 'list',
        items: [
          'Scout bonito demais: relatório de 20 páginas que ninguém lê e que adia a devolutiva.',
          'Vídeo longo demais: montagem de 15 minutos com cortes que o atleta não lembra mais.',
          'Treino desconectado: o treinador conhece o scout, mas o plano da semana já estava fechado.',
          'Pulverização: cada área da comissão tem sua versão da verdade e o elenco recebe sinais contraditórios.',
        ],
      },
      {
        type: 'quote',
        text:
          'Correção tardia vira palestra. Correção dentro da janela vira treino. A diferença está no calendário, não na qualidade do olho do analista.',
      },
      { type: 'h2', text: 'Como o SCOUT 21 sustenta o ciclo' },
      {
        type: 'p',
        text:
          'Quando scout, calendário, presença e treino estão no mesmo banco de dados, fechar o ciclo em 72h deixa de depender de força de vontade. O analista publica o scout, a comissão marca os três pontos priorizados, o treinador monta o treino da semana já conectado a esses pontos, e o atleta enxerga a mesma narrativa em todos os momentos do microciclo.',
      },
      { type: 'cta-newsletter', text: 'Receba textos curtos sobre metodologia, scout e rotina de clube — direto no seu e-mail, sem ruído.' },
      { type: 'h2', text: 'Quando o ciclo vira cultura' },
      {
        type: 'p',
        text:
          'Um ciclo cumprido uma vez é sorte. Cumprido semana após semana, vira método. E método no futsal é o que separa clube que repete um bom resultado de clube que constrói um bom ano. O scout deixa de ser obrigação relatorial e vira parte viva do treino — que é, no fim, onde a equipe realmente é construída.',
      },
      { type: 'cta-product', text: 'Veja como o SCOUT 21 conecta scout, treino e análise tática no mesmo fluxo.' },
    ],
   },
  {
    slug: 'seo-tecnico-para-sites-de-clubes-de-futsal-como-melhorar-performance-e-indexacao',
    lang: 'pt-BR',
    title: 'SEO técnico para sites de clubes de futsal: como melhorar performance e indexação',
    subtitle:
      'Muitos clubes investem em conteúdo e palavras-chave, mas esquecem da base: velocidade, estrutura e acessibilidade do site. Corrigir pontos técnicos simples pode dobrar o tráfego orgânico sem gastar um centavo em ads.',
    date: '2026-04-27',
    updatedDate: '2026-04-27',
    readMinutes: 11,
    author: 'Redação SCOUT21',
    heroEmoji: '⚙️',
    tags: ['SEO técnico', 'performance web', 'indexação', 'site esportivo'],
    excerpt:
      'Um site lento, com estrutura confusa ou erros de rastreamento perde posições no Google mesmo com bom conteúdo. Este guia mostra como auditoria e corrigir os pontos técnicos que mais afetam clubes de futsal: Core Web Vitals, arquitetura de informações, schema.org e acessibilidade.',
    keywords: [
      'SEO técnico para clubes',
      'performance site esportivo',
      'Core Web Vitals futsal',
      'schema.org clube',
      'acessibilidade site esportivo',
    ],
    translations: {
      en: 'technical-seo-for-futsal-club-sites-how-to-improve-performance-and-indexing',
      es: 'seo-tecnico-para-sitios-de-clubes-de-futsal-como-mejorar-rendimiento-e-indexacion',
    },
    coverImage: '/blog-covers/seo-tecnico-para-sites-de-clubes-de-futsal-como-melhorar-performance-e-indexacao.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Rafael Guajardo',
      photographerUrl: 'https://www.pexels.com/@rafa-guajardo',
      photoUrl: 'https://www.pexels.com/photo/close-up-of-laptop-and-notebook-1181403/',
    },
    blocks: [
      {
        type: 'p',
        text:
          'Clubes de futsal frequentemente focam em criar conteúdo de qualidade e escolher as palavras-chave certas, mas deixam de lado a fundação do SEO: os aspectos técnicos do site. Um site lento, com estrutura confusa ou erros de rastreamento pode sabotar todo o trabalho de conteúdo, fazendo com que o clube perca posições no Google mesmo produzindo materiais excelentes.',
      },
      { type: 'h2', text: 'Por que o SEO técnico é o primeiro passo' },
      {
        type: 'p',
        text:
          'Pense no SEO técnico como a fundação de uma casa. Você pode ter os móveis mais bonitos (conteúdo) e a melhor localização (palavras-chave), mas se a estrutura estiver rachada (site lento ou inacessível), tudo desaba. O Google prioriza sites que oferecem boa experiência técnica porque eles tendem a reter mais usuários.',
        },
      {
        type: 'list',
        items: [
          'Sites que carregam em até 2 segundos têm taxa de rejeição 50% menor que aqueles que levam 5 segundos ou mais',
          '70% dos usuários dizem que a velocidade da página influencia na disposição para comprar de um site',
          'O Google usa o desempenho móvel como fator de ranking desde 2018',
        ],
      },
      { type: 'callout', kind: 'tip', title: 'Teste rápido', text: 'Acesse seu site pelo celular e conte até 3. Se ainda não carregou totalmente, você tem um problema de performance que está afetando seu SEO.' },
      { type: 'h2', text: 'Os 4 pilares do SEO técnico para clubes' },
      {
        type: 'h3',
        text: '1. Core Web Vitals: a experiência do usuário medida pelo Google',
      },
      {
        type: 'p',
        text:
          'O Google mede três métricas essenciais de desempenho: LCP (maior conteúdo pintado), FID (primeiro atraso de entrada) e CLS (deslocamento layout cumulativo). Melhorar esses indicadores não só ajuda no ranking como deixa os pais e atletas mais satisfeitos ao navegar pelo site.',
      },
      {
        type: 'list',
        items: [
          'LCP (Largest Contentful Paint): mede quando o conteúdo principal aparece. Meta: menos de 2.5 segundos',
          'FID (First Input Delay): mede a interatividade. Meta: menos de 100 milissegundos',
          'CLS (Cumulative Layout Shift): mede a estabilidade visual. Meta: menos de 0.1',
        ],
      },
      {
        type: 'h3',
        text: '2. Estrutura de informações e arquitetura do site',
      },
      {
        type: 'p',
        text:
          'Um site bem estruturado ajuda tanto usuários quanto robôs de busca a encontrar o que precisam. Para clubes de futsal, isso significa organizar logicamente informações sobre modalidades, horários, professores, localização e processos de matrícula.',
      },
      {
        type: 'list',
        items: [
          'Hierarquia clara: homepage → modalidades → específicas (futsal adulto, infantil, feminino) → detalhes da turma',
          'URLs amigáveis: use /futsal-infantil ao invés de ?page_id=123',
          'Navegação consistente: menu fixo em todas as páginas com links para matrícula, contato e localização',
          'Mapa do site XML atualizado e enviado ao Google Search Console',
        ],
      },
      {
        type: 'h3',
        text: '3. Schema.org: falando a língua dos mecanismos de busca',
      },
      {
        type: 'p',
        text:
          'Marcação estruturada (schema.org) ajuda o Google a entender exatamente o que seu site oferece. Para clubes, existem tipos específicos que podem aparecer em rich results, aumentando a taxa de cliques.',
      },
      {
        type: 'list',
        items: [
          'SportsClub: define nome, localização, esporte praticado e contato',
          'SportsActivityLayer: detalha as modalidades oferecidas (futsal, futebol de salão)',
          'Course: descreve turmas, horários, níveis e preços',
          'FAQPage: para perguntas comuns sobre matrícula, horários e políticas',
        ],
      },
      {
        type: 'callout',
        kind: 'info',
        title: 'Implementação simples',
        text: 'Você não precisa ser desenvolvedor para adicionar schema. Muitos construtores de sites (WordPress, Wix, Squarespace) têm plugins específicos para esportes ou você pode usar o Google Tag Manager para inserir o JSON-LD.',
      },
      {
        type: 'h3',
        text: '4. Acessibilidade: SEO que inclui todos',
      },
      {
        type: 'p',
        text:
          'Sites acessíveis não só são obrigatórios por lei em muitos lugares, como também tendem a ter melhor desempenho em buscadores. O Google interpreta boas práticas de acessibilidade como sinal de qualidade.',
      },
      {
        type: 'list',
        items: [
          'Textos alternativos (alt) descritivos em todas as imagens',
          'Contraste adequado entre texto e fundo (verifique com ferramentas como WebAIM)',
          'Navegação por teclado possível em todos os elementos interativos',
          'Legendas em vídeos de treinos ou depoimentos',
          'Tamanho de fonte ajustável sem quebrar o layout',
        ],
      },
      { type: 'h2', text: 'Como auditor seu site em 30 minutos' },
      {
        type: 'p',
        text:
          'Você não precisa de ferramentas caras ou expertise técnica profunda para identificar os principais problemas. Com ferramentas gratuitas e atenção aos detalhes, é possível fazer uma auditoria básica que revela 80% dos pontos de melhoria.',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          'Teste de velocidade: use PageSpeed Insights (developers.google.com/speed/pagespeed/insights/) e anote os pontos fracos tanto para mobile quanto desktop',
          'Verifique mobile-friendly: teste no próprio celular e use o Mobile Friendly Test do Google',
          'Rastreie erros: no Google Search Console, veja a cobertura e procure por erros 404, redirecionamentos looping ou páginas bloqueadas por robots.txt',
          'Revise estrutura de URLs: navegue pelo site como um novo visitante e anote onde fica confuso ou onde você teria dificuldade para encontrar informações de matrícula',
          'Cheque tags fundamentais: clique com botão direito → \"Ver source da página\" e procure por <title>, <meta description> e tags de cabeçalho (h1, h2, h3)',
        ],
      },
      {
        type: 'h2',
        text: 'Priorizando correções: o que fazer primeiro',
      },
      {
        type: 'p',
        text:
          'Nem todos os problemas técnicos têm o mesmo impacto. Foque inicialmente nos que afetam tanto usuários quanto buscadores, deixando ajustes mais específicos para depois.',
      },
      {
        type: 'list',
        items: [
          'Primeiro: quaisquer erros que impedam o acesso completo ao site (down-time, loops de redirecionamento, bloqueios no robots.txt)',
          'Segundo: pontos críticos de performance que afetam a experiência real (LCP > 4s, CLS alto que faz botão \"matricule-se\" sumir)',
          'Terceiro: melhorias de estrutura que ajudam na navegação (menu confuso, páginas órfãs sem links internos)',
          'Quarto: ajustes finos de schema, metadata e acessibilidade avançada',
        ],
      },
      {
        type: 'h2',
        text: 'Ferramentas gratuitas que todo clube deveria usar',
      },
      {
        type: 'list',
        items: [
          'Google Search Console: monitora desempenho, erros de rastreamento e fornece insights de busca',
          'Google Analytics 4: entende como usuários encontram e navegam pelo site',
          'PageSpeed Insights: mede Core Web Vitals e sugere melhorias específicas',
          'GTmetrix ou Pingdom: para testes de velocidade mais detalhados e históricos',
          'Screaming Frog SEO Spider (versão gratuita até 500 URLs): rastreia seu site como o Google faz',
        ],
      },
      { type: 'cta-newsletter' },
      { type: 'h2', text: 'Manutenção contínua: transformando auditoria em hábito' },
      {
        type: 'p',
        text:
          'SEO técnico não é uma tarefa única. Sites são atualizados, plugins são adicionados e conteúdo é publicado constantemente — tudo isso pode introduzir novos problemas técnicos. A chave é transformar verificações em rotina.',
      },
      {
        type: 'list',
        items: [
          'Verifique PageSpeed Insights mensalmente para acompanhar tendências',
          'Revise o Google Search Console semanalmente em busca de novos erros',
          'Teste o processo de matrícula mensalmente em diferentes dispositivos',
          'Atualize schema.org sempre que lançar nova modalidade ou alterar horários significativamente',
          'Faça uma auditoria completa a cada trimestre com checklist personalizada para seu clube',
        ],
      },
      {
        type: 'h2',
        text: 'Quando procurar ajuda especializada',
      },
      {
        type: 'p',
        text:
          'Muitos problemas técnicos podem ser resolvidos com boas práticas e ferramentas gratuitas, mas há momentos em que vale a pena investir em expertise específica.',
      },
      {
        type: 'list',
        items: [
          'Se seu site levar mais de 5 segundos para carregar mesmo após otimizações básicas',
          'Quando precisar de implementações complexas de schema.org ou marcação avançada',
          'Para migração de plataforma (ex: mudar de Wix para WordPress) sem perder posicionamento',
          'Se notar queda súbita de tráfego orgânico sem alterações recentes de conteúdo',
        ],
      },
      {
        type: 'callout',
        kind: 'warn',
        title: 'Lembre-se crítico',
        text: 'Nenhum ajuste técnico compensa a falta de conteúdo relevante e atualizado. Pense no SEO técnico como preparar o terreno: ele permite que seu conteúdo floresça, mas não substitui a necessidade de plantar sementes de qualidade.',
      },
      { type: 'cta-product' },
    ],
  },
  {
    slug: 'seo-pratico-para-blogs-tecnicos-estruture-otimize-e-converta',
    lang: 'pt-BR',
    title: 'SEO prático para blogs técnicos: estruture, otimize e converta',
    subtitle: 'Um guia direto para transformar posts técnicos em ativos de aquisição com estrutura editorial, palavras-chave e melhorias rápidas de performance.',
    date: '2026-04-29',
    updatedDate: '2026-04-29',
    readMinutes: 8,
    author: 'Redação SCOUT21',
    heroEmoji: '🚀',
    tags: ['SEO prático', 'blog técnico', 'conteúdo', 'conversão'],
    excerpt: 'Aprenda um framework simples para planejar, produzir e otimizar posts técnicos com foco em intenção de busca e geração de demanda.',
    keywords: ['seo para blog técnico', 'otimização de conteúdo', 'palavra-chave de intenção', 'estrutura de post'],
    translations: {
      en: 'practical-seo-for-technical-blogs-structure-optimize-and-convert',
      es: 'seo-practico-para-blogs-tecnicos-estructura-optimiza-y-convierte',
    },
    coverImage: '/blog-covers/seo-tecnico-para-sites-de-clubes-de-futsal-como-melhorar-performance-e-indexacao.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Rafael Guajardo',
      photographerUrl: 'https://www.pexels.com/@rafa-guajardo',
      photoUrl: 'https://www.pexels.com/photo/close-up-of-laptop-and-notebook-1181403/',
    },
    blocks: [
      {
        type: 'p',
        text: 'Neste post apresentamos uma abordagem prática de SEO para blogs técnicos. Você aprenderá a estruturar conteúdos com foco na intenção do leitor, escolher palavras-chave alinhadas à busca e aplicar otimizações rápidas que elevam o ranqueamento e a experiência do usuário.',
      },
      { type: 'h2', text: 'Framework simples em 4 passos' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Defina uma intenção principal por post e uma palavra-chave primária.',
          'Estruture o conteúdo com blocos curtos, exemplos reais e CTAs claros.',
          'Otimize título, metadados, links internos e cobertura semântica.',
          'Revise performance, indexação e atualização periódica do conteúdo.',
        ],
      },
      { type: 'cta-newsletter', text: 'Receba frameworks semanais para conteúdo, SEO e operação de growth.' },
      { type: 'cta-product', text: 'Conheça como o SCOUT21 transforma dados e rotina em crescimento previsível.' },
    ],
  },
  {
    slug: 'plano-editorial-semanal-para-clubes-como-publicar-com-consistencia',
    locale: 'pt',
    title: 'Plano editorial semanal para clubes: como publicar com consistência',
    date: '2026-04-30',
    updatedDate: '2026-04-30',
    readMinutes: 7,
    author: 'Redação SCOUT21',
    heroEmoji: '📈',
    tags: ['SEO', 'conteúdo', 'futsal', 'growth'],
    excerpt: 'Guia prático para manter ritmo diário de publicação com qualidade editorial e impacto em tráfego orgânico.',
    keywords: ['blog futsal', 'seo conteúdo', 'publicação diária', 'tráfego orgânico'],
    translations: {
      en: 'weekly-editorial-plan-for-clubs-how-to-publish-consistently',
      es: 'plan-editorial-semanal-para-clubes-como-publicar-con-consistencia',
    },
    coverImage: '/blog-covers/seo-tecnico-para-sites-de-clubes-de-futsal-como-melhorar-performance-e-indexacao.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Rafael Guajardo',
      photographerUrl: 'https://www.pexels.com/@rafa-guajardo',
      photoUrl: 'https://www.pexels.com/photo/close-up-of-laptop-and-notebook-1181403/',
    },
    blocks: [
      {
        type: 'p',
        text: 'Este conteúdo traz um playbook simples para operar um blog diário sem perder qualidade. O foco é alinhar intenção de busca, execução enxuta e revisão mínima obrigatória antes de publicar.',
      },
      { type: 'h2', text: 'Framework operacional' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Defina tema, intenção e CTA principal em até 10 minutos.',
          'Produza primeiro rascunho com estrutura curta e objetiva.',
          'Revise SEO on-page e consistência de links internos.',
          'Publique e recircule o conteúdo em canais prioritários.',
        ],
      },
      { type: 'cta-newsletter', text: 'Receba semanalmente frameworks de operação editorial.' },
      { type: 'cta-product', text: 'Veja como o SCOUT21 acelera sua rotina de conteúdo.' },
    ],
  },
  {
    slug: 'keyword-clusters-no-futsal-como-cobrir-intencoes-e-ganhar-trafego',
    locale: 'pt',
    title: 'Keyword clusters no futsal: como cobrir intenções e ganhar tráfego',
    date: '2026-05-01',
    updatedDate: '2026-05-01',
    readMinutes: 7,
    author: 'Redação SCOUT21',
    heroEmoji: '📈',
    tags: ['SEO', 'conteúdo', 'futsal', 'growth'],
    excerpt: 'Guia prático para manter ritmo diário de publicação com qualidade editorial e impacto em tráfego orgânico.',
    keywords: ['blog futsal', 'seo conteúdo', 'publicação diária', 'tráfego orgânico'],
    translations: {
      en: 'futsal-keyword-clusters-cover-intent-and-grow-traffic',
      es: 'clusters-de-palabras-clave-en-futsal-cubre-intencion-y-gana-trafico',
    },
    coverImage: '/blog-covers/seo-tecnico-para-sites-de-clubes-de-futsal-como-melhorar-performance-e-indexacao.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Rafael Guajardo',
      photographerUrl: 'https://www.pexels.com/@rafa-guajardo',
      photoUrl: 'https://www.pexels.com/photo/close-up-of-laptop-and-notebook-1181403/',
    },
    blocks: [
      {
        type: 'p',
        text: 'Este conteúdo traz um playbook simples para operar um blog diário sem perder qualidade. O foco é alinhar intenção de busca, execução enxuta e revisão mínima obrigatória antes de publicar.',
      },
      { type: 'h2', text: 'Framework operacional' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Defina tema, intenção e CTA principal em até 10 minutos.',
          'Produza primeiro rascunho com estrutura curta e objetiva.',
          'Revise SEO on-page e consistência de links internos.',
          'Publique e recircule o conteúdo em canais prioritários.',
        ],
      },
      { type: 'cta-newsletter', text: 'Receba semanalmente frameworks de operação editorial.' },
      { type: 'cta-product', text: 'Veja como o SCOUT21 acelera sua rotina de conteúdo.' },
    ],
  },
  {
    slug: 'seo-on-page-para-posts-tecnicos-checklist-rapido-antes-de-publicar',
    locale: 'pt',
    title: 'SEO on-page para posts técnicos: checklist rápido antes de publicar',
    date: '2026-05-02',
    updatedDate: '2026-05-02',
    readMinutes: 7,
    author: 'Redação SCOUT21',
    heroEmoji: '📈',
    tags: ['SEO', 'conteúdo', 'futsal', 'growth'],
    excerpt: 'Guia prático para manter ritmo diário de publicação com qualidade editorial e impacto em tráfego orgânico.',
    keywords: ['blog futsal', 'seo conteúdo', 'publicação diária', 'tráfego orgânico'],
    translations: {
      en: 'on-page-seo-for-technical-posts-fast-prepublish-checklist',
      es: 'seo-on-page-para-posts-tecnicos-checklist-rapido-antes-de-publicar',
    },
    coverImage: '/blog-covers/seo-tecnico-para-sites-de-clubes-de-futsal-como-melhorar-performance-e-indexacao.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Rafael Guajardo',
      photographerUrl: 'https://www.pexels.com/@rafa-guajardo',
      photoUrl: 'https://www.pexels.com/photo/close-up-of-laptop-and-notebook-1181403/',
    },
    blocks: [
      {
        type: 'p',
        text: 'Este conteúdo traz um playbook simples para operar um blog diário sem perder qualidade. O foco é alinhar intenção de busca, execução enxuta e revisão mínima obrigatória antes de publicar.',
      },
      { type: 'h2', text: 'Framework operacional' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Defina tema, intenção e CTA principal em até 10 minutos.',
          'Produza primeiro rascunho com estrutura curta e objetiva.',
          'Revise SEO on-page e consistência de links internos.',
          'Publique e recircule o conteúdo em canais prioritários.',
        ],
      },
      { type: 'cta-newsletter', text: 'Receba semanalmente frameworks de operação editorial.' },
      { type: 'cta-product', text: 'Veja como o SCOUT21 acelera sua rotina de conteúdo.' },
    ],
  },
  {
    slug: 'distribuicao-pos-publicacao-como-recircular-conteudo-e-aumentar-alcance',
    locale: 'pt',
    title: 'Distribuição pós-publicação: como recircular conteúdo e aumentar alcance',
    date: '2026-05-03',
    updatedDate: '2026-05-03',
    readMinutes: 7,
    author: 'Redação SCOUT21',
    heroEmoji: '📈',
    tags: ['SEO', 'conteúdo', 'futsal', 'growth'],
    excerpt: 'Guia prático para manter ritmo diário de publicação com qualidade editorial e impacto em tráfego orgânico.',
    keywords: ['blog futsal', 'seo conteúdo', 'publicação diária', 'tráfego orgânico'],
    translations: {
      en: 'post-publish-distribution-how-to-recirculate-content-and-expand-reach',
      es: 'distribucion-post-publicacion-como-recircular-contenido-y-ampliar-alcance',
    },
    coverImage: '/blog-covers/seo-tecnico-para-sites-de-clubes-de-futsal-como-melhorar-performance-e-indexacao.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Rafael Guajardo',
      photographerUrl: 'https://www.pexels.com/@rafa-guajardo',
      photoUrl: 'https://www.pexels.com/photo/close-up-of-laptop-and-notebook-1181403/',
    },
    blocks: [
      {
        type: 'p',
        text: 'Este conteúdo traz um playbook simples para operar um blog diário sem perder qualidade. O foco é alinhar intenção de busca, execução enxuta e revisão mínima obrigatória antes de publicar.',
      },
      { type: 'h2', text: 'Framework operacional' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Defina tema, intenção e CTA principal em até 10 minutos.',
          'Produza primeiro rascunho com estrutura curta e objetiva.',
          'Revise SEO on-page e consistência de links internos.',
          'Publique e recircule o conteúdo em canais prioritários.',
        ],
      },
      { type: 'cta-newsletter', text: 'Receba semanalmente frameworks de operação editorial.' },
      { type: 'cta-product', text: 'Veja como o SCOUT21 acelera sua rotina de conteúdo.' },
    ],
  },
  {
    slug: 'cadencia-diaria-de-conteudo-como-medir-qualidade-sem-perder-velocidade',
    locale: 'pt',
    title: 'Cadência diária de conteúdo: como medir qualidade sem perder velocidade',
    date: '2026-05-04',
    updatedDate: '2026-05-04',
    readMinutes: 7,
    author: 'Redação SCOUT21',
    heroEmoji: '📈',
    tags: ['SEO', 'conteúdo', 'futsal', 'growth'],
    excerpt: 'Guia prático para manter ritmo diário de publicação com qualidade editorial e impacto em tráfego orgânico.',
    keywords: ['blog futsal', 'seo conteúdo', 'publicação diária', 'tráfego orgânico'],
    translations: {
      en: 'daily-content-cadence-how-to-measure-quality-without-losing-speed',
      es: 'cadencia-diaria-de-contenido-como-medir-calidad-sin-perder-velocidad',
    },
    coverImage: '/blog-covers/seo-tecnico-para-sites-de-clubes-de-futsal-como-melhorar-performance-e-indexacao.jpg',
    coverCredit: {
      source: 'Pexels',
      photographer: 'Rafael Guajardo',
      photographerUrl: 'https://www.pexels.com/@rafa-guajardo',
      photoUrl: 'https://www.pexels.com/photo/close-up-of-laptop-and-notebook-1181403/',
    },
    blocks: [
      {
        type: 'p',
        text: 'Este conteúdo traz um playbook simples para operar um blog diário sem perder qualidade. O foco é alinhar intenção de busca, execução enxuta e revisão mínima obrigatória antes de publicar.',
      },
      { type: 'h2', text: 'Framework operacional' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Defina tema, intenção e CTA principal em até 10 minutos.',
          'Produza primeiro rascunho com estrutura curta e objetiva.',
          'Revise SEO on-page e consistência de links internos.',
          'Publique e recircule o conteúdo em canais prioritários.',
        ],
      },
      { type: 'cta-newsletter', text: 'Receba semanalmente frameworks de operação editorial.' },
      { type: 'cta-product', text: 'Veja como o SCOUT21 acelera sua rotina de conteúdo.' },
    ],
  }
];
