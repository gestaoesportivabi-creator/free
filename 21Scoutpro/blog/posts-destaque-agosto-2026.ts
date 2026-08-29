import type { BlogPost } from './types';

const CTA = (slug: string) =>
  ({
    type: 'cta-product' as const,
    text: 'Teste o SCOUT21 com seu elenco por 30 dias. Sem cartão.',
    href: `/criar-conta?utm_source=blog-${slug}`,
    button: 'Começar teste grátis',
  });

/**
 * Série editorial agosto/2026 — alinhada à fila Instagram (posts 0–6).
 * Ordem do array = ordem no /blog (destaque no topo).
 */
export const POSTS_DESTAQUE_AGOSTO_2026: BlogPost[] = [
  {
    slug: 'comissao-nao-decide-no-escuro-futsal',
    lang: 'pt-BR',
    title: 'A comissão não decide no escuro: gestão com dados no futsal',
    subtitle:
      'Planilha, memória de vestiário e pressa antes do treino não são falta de empenho. São falta de sistema. O que muda é ter scout, carga e elenco falando a mesma língua.',
    date: '2026-08-29',
    updatedDate: '2026-08-29',
    readMinutes: 5,
    author: 'Redação SCOUT21',
    heroEmoji: '🎯',
    tags: ['gestão', 'comissão técnica', 'dados', 'futsal'],
    excerpt:
      'No futsal de clube, a decisão do dia costuma nascer de planilha velha, grupo de WhatsApp e “acho que ele reclamou do joelho”. Dá para trabalhar melhor — com histórico, contexto e menos retrabalho.',
    keywords: [
      'gestão esportiva futsal',
      'comissão técnica futsal',
      'dados no futsal',
      'scout futsal',
      'monitoramento de carga',
    ],
    coverImage: '/blog-covers/por-que-dados-no-banco-importam-mais-que-no-papel.jpg',
    blocks: [
      {
        type: 'p',
        text:
          'Toda comissão de futsal conhece a cena: são 18h30, o treino começa às 19h, alguém pergunta “quem aguenta intensidade hoje?” e a resposta mistura memória do último jogo, mensagem de atleta no grupo e uma planilha que ninguém atualizou na semana passada. Não é preguiça. É o jeito que o clube organizou a informação — ou deixou de organizar.',
      },
      {
        type: 'p',
        text:
          'O futsal brasileiro cresceu em quadra, mas a gestão de performance ainda patina entre caderno, Excel e print. Enquanto isso, literatura de carga e prontidão já mostra há anos que decisão diária melhora quando sono, esforço percebido e histórico de treino/jogo entram na mesma conversa. O problema não é “falta de ciência”. É falta de fluxo.',
      },
      { type: 'h2', text: 'Onde a decisão escapa' },
      {
        type: 'list',
        items: [
          'A planilha: útil no começo, depois vira arquivo morto que ninguém abre depois do treino.',
          'A memória: “ele reclamou do joelho semana passada… acho” — sem data, sem série, sem contexto de minutos.',
          'O tempo: montar relatório na mão antes de cada sessão compete com vídeo, reunião e logística.',
        ],
      },
      {
        type: 'p',
        text:
          'Scout sem sistema vira arquivo. Carga sem rotina vira formulário que o atleta ignora. Elenco sem histórico vira lista que reinicia a cada temporada. A comissão até tenta — mas decide no escuro porque os dados não chegam juntos, no horário certo, no mesmo painel.',
      },
      { type: 'h2', text: 'O que uma plataforma de futsal precisa resolver' },
      {
        type: 'p',
        text:
          'Não é virar Wyscout nem comprar GPS. É fechar o ciclo que o treinador já vive: registrar o jogo, entender quem performou, saber quem está bem para treinar amanhã — sem abrir cinco lugares diferentes. No SCOUT21 isso se organiza em três perguntas que a comissão já faz todo dia:',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          'O elenco aguenta treinar forte hoje? (prontidão, PSE, sono, bem-estar, ACWR)',
          'O que aconteceu no jogo? (coleta scout ao vivo ou súmula)',
          'Quem precisa de atenção na carga? (alertas interpretativos, não só número solto)',
        ],
      },
      {
        type: 'callout',
        kind: 'info',
        title: 'Futsal nativo',
        text:
          'O SCOUT21 nasceu para comissão enxuta de futsal: cronômetro de período, eventos de quadra, ranking do elenco e fisiologia no mesmo login — não um ERP genérico de “qualquer esporte”.',
      },
      { type: 'h2', text: 'Da reunião de segunda ao treino de terça' },
      {
        type: 'p',
        text:
          'Imagine a semana com histórico vivo: o jogo de sábado entra no sistema ainda no vestiário ou pela súmula no domingo; segunda a comissão olha ranking com função e minutos; terça de manhã os atletas respondem sono e PSE pelo Telegram; antes do apito o painel mostra score de prontidão e sugestão de intensidade da sessão. Não é futuro. É o fluxo que o produto já suporta no trial de 30 dias, sem cartão.',
      },
      {
        type: 'quote',
        text: 'Dado que não entra no elenco vira opinião. Opinião não escala com 14 atletas e duas competições.',
      },
      { type: 'h2', text: 'Por onde começar sem virar projeto de TI' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Cadastre o elenco (pode colar de planilha ou usar dados demo).',
          'Vincule atletas ao @scout21bot no Telegram — sem app novo.',
          'Registre o próximo jogo ao vivo ou pela súmula.',
          'No dia seguinte, olhe prontidão antes de prescrever carga.',
        ],
      },
      {
        type: 'callout',
        kind: 'tip',
        title: 'Expectativa honesta',
        text:
          'Scout individual, quarteto, musculação e módulo atletas-fisio ainda estão em desenvolvimento no produto. O que já funciona para divulgar com segurança: scout coletivo, ranking, coleta ao vivo com autosave, PSE/PSR, prontidão, ACWR 7/28 e assistente com contexto do elenco.',
      },
      CTA('comissao-nao-decide-no-escuro-futsal'),
    ],
  },
  {
    slug: 'coleta-scout-ao-vivo-ou-sumula-futsal',
    lang: 'pt-BR',
    title: 'Coleta scout ao vivo ou pela súmula: o jogo entra no elenco',
    subtitle:
      'Doze tipos de evento, cronômetro de período e autosave enquanto a partida rola. Ou lançamento depois pela súmula. Os dois alimentam o mesmo ranking.',
    date: '2026-08-29',
    updatedDate: '2026-08-29',
    readMinutes: 5,
    author: 'Redação SCOUT21',
    heroEmoji: '⚽',
    tags: ['scout', 'coleta', 'análise de jogo', 'futsal'],
    excerpt:
      'Scout no caderno some no bolso do auxiliar. Scout na planilha atrasa a semana. Coleta integrada ao elenco devolve ranking, tendência e conversa de comissão com dado na mesa.',
    keywords: [
      'coleta scout futsal',
      'scout ao vivo',
      'súmula futsal',
      'estatísticas futsal',
      'análise de desempenho futsal',
    ],
    coverImage: '/blog-covers/scout-alem-dos-numeros-contexto-para-o-treinador.jpg',
    blocks: [
      {
        type: 'p',
        text:
          'O jogo acabou. Alguém anotou gols e cartões no caderno. Outro gravou vídeo. O preparador lembra que “o 7 cansou no segundo tempo”, mas não lembra em que minuto. Na reunião de segunda, cada um traz um recorte. Ranking vira debate de memória.',
      },
      {
        type: 'p',
        text:
          'Scout de futsal não precisa ser luxo de clube grande. Precisa ser registrado no mesmo lugar onde o elenco vive — para segunda-feira não começar do zero. O SCOUT21 oferece dois caminhos reais, com o mesmo destino: estatísticas do jogo ligadas a cada atleta.',
      },
      { type: 'h2', text: 'Coleta ao vivo: com o jogo rolando' },
      {
        type: 'p',
        text:
          'Na tela de coleta ao vivo, o cronômetro segue a lógica de período (1º e 2º tempo). Enquanto o relógio corre, a comissão registra eventos por toque — gol, finalização, falta, desarme, defesa, cartão, escanteio, tiro livre, pênalti, lateral, passe e bloqueio. São doze tipos de evento pensados para a quadra, não uma lista genérica de “outros”.',
      },
      {
        type: 'callout',
        kind: 'info',
        title: 'Autosave, não offline',
        text:
          'A sessão salva automaticamente a cada poucos segundos enquanto a coleta está aberta. Se a conexão cair, não prometemos fila offline — o que temos é persistência contínua durante o jogo com conexão ativa.',
      },
      { type: 'h2', text: 'Súmula: quando o jogo já passou' },
      {
        type: 'p',
        text:
          'Nem sempre há analista dedicado na beira da quadra. O fluxo pós-jogo permite lançar os mesmos tipos de ação pela súmula: gols e assistências, passes (certos, errados, transição, progressão), finalizações, faltas, desarmes, defesas, cartões e bolas paradas. O dado entra no histórico do atleta e alimenta o scout coletivo — como se tivesse sido coletado ao vivo.',
      },
      { type: 'h2', text: 'O que a comissão ganha na segunda-feira' },
      {
        type: 'list',
        items: [
          'Ranking com dezoito categorias estatísticas — de gols a erros de transição.',
          'Filtros por competição, mês, adversário, mandante/visitante, período e atleta.',
          'Modo RAIO-X para comparar jogos e ler tendência, não só um placar de estatística.',
          'Export PDF do relatório gerencial quando o plano inclui essa camada.',
        ],
      },
      {
        type: 'p',
        text:
          'Um jogo isolado é recorte. Valor aparece quando você compara partidas, filtra por função e minutos, e abre conversa com o atleta sobre série — não sobre uma tarde boa ou ruim.',
      },
      {
        type: 'quote',
        text: 'Scout que não entra no sistema é arquivo. Arquivo não treina ninguém na terça.',
      },
      { type: 'h2', text: 'Como encaixar na rotina do clube' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Defina quem coleta ao vivo (analista, auxiliar ou treinador com tablet).',
          'Se não der, combine lançamento pela súmula em até 24h.',
          'Use o ranking na reunião técnica com filtro de minutos — evita ego de “artilheiro” sem contexto.',
          'Cruze com prontidão no dia seguinte: desempenho + carga na mesma conta.',
        ],
      },
      CTA('coleta-scout-ao-vivo-ou-sumula-futsal'),
    ],
  },
  {
    slug: 'ranking-scout-com-contexto-futsal',
    lang: 'pt-BR',
    title: 'Ranking scout com contexto: quem jogou melhor — e por quê',
    subtitle:
      'Número sem função, minuto e tendência vira ego ou injustiça. Ranking com scout coletivo devolve conversa de comissão.',
    date: '2026-08-29',
    updatedDate: '2026-08-29',
    readMinutes: 5,
    author: 'Redação SCOUT21',
    heroEmoji: '📊',
    tags: ['ranking', 'scout', 'desempenho', 'futsal'],
    excerpt:
      '“Quem está jogando melhor?” é pergunta legítima. A resposta ruim é achismo de vestiário. A resposta boa cruza estatística do jogo com função, tempo em quadra e série de partidas.',
    keywords: [
      'ranking futsal',
      'estatísticas jogador futsal',
      'scout coletivo',
      'análise de desempenho',
    ],
    coverImage: '/blog-covers/indicadores-de-alta-performance-para-clubes-de-futsal.jpg',
    blocks: [
      {
        type: 'p',
        text:
          'Depois do clássico, o grupo pergunta quem foi o destaque. O treinador aponta o artilheiro. O preparador lembra do desarme no segundo tempo. O goleiro discorda. Todos têm razão parcial — porque cada um viu um recorte.',
      },
      {
        type: 'p',
        text:
          'Ranking não é ferramenta de vaidade. É atalho para a pergunta certa: quem está contribuindo dentro do que o sistema pede, com os minutos que recebeu, ao longo de mais de um jogo? No SCOUT21, o ranking nasce da coleta scout — ao vivo ou súmula — e já nasce ligado ao elenco.',
      },
      { type: 'h2', text: 'O que entra no ranking' },
      {
        type: 'p',
        text:
          'O painel trabalha com dezoito categorias: gols, assistências, variações de passe, finalizações, desarmes, erros de transição, faltas, defesas, cartões, gols sofridos e mais. Pódio dos três primeiros e tabela completa. Tudo filtrável por competição — útil quando o time joga estadual e amistoso no mesmo mês.',
      },
      { type: 'h2', text: 'Contexto antes de comparar' },
      {
        type: 'list',
        items: [
          'Função: fixo que defende mais x ala que finaliza mais — comparar sem isso distorce.',
          'Minutos: três gols em vinte minutos não é a mesma conversa que um gol em quarenta.',
          'Período: 1º ou 2º tempo — leitura tática muda.',
          'Adversário e mando: série contra times fortes pesa diferente de amistoso.',
        ],
      },
      {
        type: 'callout',
        kind: 'tip',
        title: 'Ranking não é convocação automática',
        text:
          'O sistema registra e ordena. A comissão interpreta. Dado bom abre diálogo; dado ruim (sem contexto) fecha conversa no vestiário.',
      },
      { type: 'h2', text: 'Scout coletivo além da tabela' },
      {
        type: 'p',
        text:
          'O módulo de scout coletivo soma jogos, médias de gols, distribuição por período, métodos de gol marcados e sofridos, origem bola rolando versus parada, e análise tática por partida. Seis filtros principais — competição, mês, adversário, local, período e atleta — evitam que a comissão misture cenários diferentes na mesma leitura.',
      },
      {
        type: 'quote',
        text: 'Um jogo é recorte. A tendência é que muda convocação, minutos e conversa individual.',
      },
      { type: 'h2', text: 'Na prática da reunião técnica' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Abra o ranking filtrado pelo jogo de fim de semana.',
          'Compare com a média das últimas três partidas da mesma competição.',
          'Separe “quem subiu” de “quem precisa de apoio” — são conversas diferentes.',
          'Feche com ação: minutos no treino, vídeo ou ajuste tático — não só elogio.',
        ],
      },
      CTA('ranking-scout-com-contexto-futsal'),
    ],
  },
  {
    slug: 'tendencia-ranking-scout-futsal',
    lang: 'pt-BR',
    title: 'Tendência no ranking: um jogo não conta a história do atleta',
    subtitle:
      'Evolução aparece quando você compara partidas, não quando fixa o artilheiro da rodada. É assim que o scout vira gestão.',
    date: '2026-08-29',
    updatedDate: '2026-08-29',
    readMinutes: 5,
    author: 'Redação SCOUT21',
    heroEmoji: '📈',
    tags: ['ranking', 'tendência', 'scout', 'gestão'],
    excerpt:
      'O atleta que explodiu sábado pode ter série morna. O que parecia apagado pode estar subindo em desarmes e transição. Sem tendência, o clube reage tarde.',
    keywords: [
      'tendência desempenho futsal',
      'evolução atleta futsal',
      'scout série de jogos',
      'gestão de elenco futsal',
    ],
    coverImage: '/blog-covers/ciclo-de-feedback-scout-treino-72h-futsal.jpg',
    blocks: [
      {
        type: 'p',
        text:
          'Clube que só olha o último resultado trata elenco como foto. Elenco é filme. O fixo que errou três passes pode estar melhorando saída de bola há um mês. O ala que fez dois gols pode estar jogando minutos demais em sequência. Sem série, a comissão premia sorte ou pune um dia ruim.',
      },
      { type: 'h2', text: 'Por que um jogo engana' },
      {
        type: 'list',
        items: [
          'Placar favorável esconde desequilíbrio individual.',
          'Adversário fraco infla estatística ofensiva.',
          'Cartão e lesão mudam minutos — comparar totais brutos distorce.',
          'Estratégia do treinador muda função: o dado precisa de rótulo tático.',
        ],
      },
      { type: 'h2', text: 'Como ler série no SCOUT21' },
      {
        type: 'p',
        text:
          'Filtre competição e intervalo de datas. Use o modo de comparação entre jogos (RAIO-X) para ver distribuição de gols por período, eficiência ofensiva e defensiva, e desempenho individual no recorte escolhido. Volte ao ranking com filtro de atleta e percorra as últimas partidas — a pergunta deixa de ser “quem jogou bem sábado?” e vira “quem está consistente no que pedimos?”.',
      },
      {
        type: 'callout',
        kind: 'info',
        title: 'Dado orienta, comissão decide',
        text:
          'O sistema não convoca ninguém sozinho. Ele evita que a reunião de segunda seja só lembrança emocional do sábado.',
      },
      { type: 'h2', text: 'Perguntas que valem mais que o pódio' },
      {
        type: 'list',
        items: [
          'Quem melhorou em desarmes nas últimas quatro partidas?',
          'Quem caiu em passes certos mas mantém minutos altos?',
          'Quem aparece no ranking ofensivo só contra adversários fracos?',
          'Quem sumiu das estatísticas relevantes depois de voltar de lesão?',
        ],
      },
      { type: 'h2', text: 'Ligando tendência a carga' },
      {
        type: 'p',
        text:
          'Desempenho em queda + ACWR alto + sono ruim é conversa de gestão de carga, não só de vídeo. Quando scout e fisiologia moram na mesma conta, a comissão vê desempenho e prontidão sem exportar planilha. Esse é o argumento de fundo do SCOUT21: menos fricção entre “quem jogou” e “quem aguenta treinar”.',
      },
      {
        type: 'quote',
        text: 'Tendência não é gráfico bonito. É o que impede surpresa na quarta-feira.',
      },
      CTA('tendencia-ranking-scout-futsal'),
    ],
  },
  {
    slug: 'prontidao-antes-do-treino-futsal',
    lang: 'pt-BR',
    title: 'Escalado não é pronto: prontidão antes do treino no futsal',
    subtitle:
      'Convocação diz quem entra. Prontidão diz com qual carga treinar. São decisões diferentes — e o clube confunde as duas todo dia.',
    date: '2026-08-29',
    updatedDate: '2026-08-29',
    readMinutes: 5,
    author: 'Redação SCOUT21',
    heroEmoji: '💤',
    tags: ['prontidão', 'PSE', 'carga', 'futsal'],
    excerpt:
      'Atleta na lista não significa atleta recuperado. Sono, PSE, bem-estar e histórico de carga formam um score que ajuda a prescrever intensidade — se a comissão tiver o dado antes do apito.',
    keywords: [
      'prontidão atleta futsal',
      'PSE futsal',
      'monitoramento carga treino',
      'escalado pronto treino',
    ],
    coverImage: '/blog-covers/monitoramento-fisiologico-no-futsal-com-pse-psr-e-bem-estar.jpg',
    blocks: [
      {
        type: 'p',
        text:
          'O treinador publica a lista às 16h. Às 18h descobre que o fixo dormiu quatro horas e o ala marcou PSE 9 ontem. A sessão estava desenhada para alta intensidade. Alguém improvisa, alguém reclama, alguém se machuca na semana seguinte. Não por falta de cuidado — por falta de dado no horário certo.',
      },
      { type: 'h2', text: 'O que é prontidão neste contexto' },
      {
        type: 'p',
        text:
          'Prontidão aqui não é “motivação” nem teste médico. É leitura operacional: com base em PSE recente, qualidade de sono, bem-estar (estresse, humor, dor, satisfação), lesão ativa e razão carga aguda:crônica (ACWR 7/28), o sistema calcula um score de 0 a 100 por atleta e uma média para o elenco. A partir disso, sugere intensidade da sessão — leve, moderada ou forte — e lista atletas sinalizados.',
      },
      {
        type: 'callout',
        kind: 'warn',
        title: 'Não substitui preparador nem médico',
        text:
          'Alertas interpretativos apontam risco e abrem conversa. Quem prescreve e quem libera jogo continua sendo a comissão.',
      },
      { type: 'h2', text: 'ACWR em linguagem de comissão' },
      {
        type: 'p',
        text:
          'ACWR compara a carga média dos últimos sete dias com a dos últimos vinte e oito. Acima de 1,3, o sistema já penaliza o score individual; acima de 1,5, entra faixa de alerta mais severa. É o mesmo raciocínio que clubes grandes usam com GPS — aqui alimentado por PSE/PSR e rotina de treino/jogo que o atleta registra.',
      },
      { type: 'h2', text: 'Antes do apito, não depois' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Atletas respondem sono e bem-estar pela manhã (Telegram ou portal).',
          'PSE de ontem já está no histórico do jogador.',
          'Comissão abre o painel e vê score + atletas sinalizados.',
          'Ajusta intensidade, grupos ou minutos antes da sessão começar.',
        ],
      },
      {
        type: 'quote',
        text: 'Escalar é decisão tática. Prontidão é decisão de carga. Misturar as duas é treinar no escuro.',
      },
      { type: 'h2', text: 'O que muda na prática' },
      {
        type: 'p',
        text:
          'Em vez de “achar que o grupo aguenta”, a comissão nomeia três atletas sinalizados e reduz volume para um deles — com dado na tela. Em vez de planilha paralela de bem-estar, histórico fica no jogador. Trial de 30 dias libera fisiologia no plano PERFORMANCE sem cartão — tempo suficiente para testar se o elenco adere ao fluxo.',
      },
      CTA('prontidao-antes-do-treino-futsal'),
    ],
  },
  {
    slug: 'telegram-prontidao-acwr-futsal',
    lang: 'pt-BR',
    title: 'Telegram, prontidão e ACWR: o fluxo que o atleta completa em segundos',
    subtitle:
      'Sem app novo, sem senha extra. O @scout21bot pergunta; o painel da comissão cruza. É assim que o dado entra antes do treino.',
    date: '2026-08-29',
    updatedDate: '2026-08-29',
    readMinutes: 5,
    author: 'Redação SCOUT21',
    heroEmoji: '📱',
    tags: ['Telegram', 'prontidão', 'ACWR', 'atleta'],
    excerpt:
      'Adoção mata mais projeto de monitoramento do que fórmula. Por isso o SCOUT21 usa o Telegram que o atleta já tem — com /hoje e /preencher.',
    keywords: [
      'telegram atleta futsal',
      'monitoramento bem-estar',
      'PSE telegram',
      'prontidão ACWR',
    ],
    coverImage: '/blog-covers/gestao-de-equipe-no-futsal-como-parar-de-gerir-no-grupo.jpg',
    blocks: [
      {
        type: 'p',
        text:
          'Quantos apps o seu elenco já instalou e abandonou? Formulário no link do grupo vira mensagem ignorada. Planilha compartilhada vira “depois eu preencho”. O gargalo da prontidão raramente é ciência — é atrito.',
      },
      { type: 'h2', text: 'Como o atleta entra' },
      {
        type: 'p',
        text:
          'No SCOUT21, o clube cadastra o jogador e ele vincula a conta ao @scout21bot com /vincular email senha. A partir daí, /hoje mostra o que falta responder no dia; /preencher abre o menu de formulários pendentes. Bem-estar usa cinco dimensões (estresse, sono, humor, dor, satisfação). PSE e PSR aparecem quando há treino ou jogo programado na semana.',
      },
      {
        type: 'callout',
        kind: 'tip',
        title: 'Lembrete automático',
        text:
          'O bot pode enviar lembrete matinal para quem ainda tem pendência — útil em elenco que “esquece” até o ônibus.',
      },
      { type: 'h2', text: 'O que acontece no servidor' },
      {
        type: 'p',
        text:
          'Cada resposta grava no histórico do atleta. O backend calcula ACWR com janelas de sete e vinte e oito dias, aplica penalidades por lesão ativa, sono baixo, estresse alto e ratio elevado, e devolve score individual e de equipe. A recomendação de sessão (leve, moderada ou forte) nasce dessa média + alertas vermelhos.',
      },
      { type: 'h2', text: 'O que a comissão vê' },
      {
        type: 'list',
        items: [
          'Score de prontidão do elenco (ex.: 62/100).',
          'Sugestão de intensidade da sessão.',
          'Lista de atletas sinalizados — até dez, ordenados por risco.',
          'Alertas em frase: “sono baixo + PSE alto”, “ACWR acima de 1,5”, etc.',
        ],
      },
      {
        type: 'p',
        text:
          'O assistente web e o briefing pré-jogo também consomem essa camada — útil na véspera de partida de campeonato quando a comissão quer resumo de disponíveis, lesionados e alertas principais.',
      },
      {
        type: 'quote',
        text: 'O dado só serve se o atleta responder. Por isso o canal é Telegram — não mais um ícone esquecido na tela do celular.',
      },
      { type: 'h2', text: 'Portal do atleta como alternativa' },
      {
        type: 'p',
        text:
          'Quem preferir web usa o portal com as mesmas abas: PSE, PSR, bem-estar e perfil. Telegram e portal alimentam o mesmo banco. A comissão não precisa escolher — pode misturar conforme o perfil do elenco.',
      },
      CTA('telegram-prontidao-acwr-futsal'),
    ],
  },
  {
    slug: 'scout-fisiologia-elenco-scout21',
    lang: 'pt-BR',
    title: 'Scout, fisiologia e elenco no mesmo painel: o que o SCOUT21 entrega hoje',
    subtitle:
      'Uma conta, um histórico, menos ruído entre treino, jogo e carga. Visão honesta do que já funciona — e do que ainda está no roadmap.',
    date: '2026-08-29',
    updatedDate: '2026-08-29',
    readMinutes: 6,
    author: 'Redação SCOUT21',
    heroEmoji: '🏟️',
    tags: ['SCOUT21', 'plataforma', 'gestão', 'futsal'],
    excerpt:
      'O clube não precisa de dez ferramentas. Precisa que segunda-feira comece com elenco, último jogo e prontidão de hoje no mesmo login. É o problema que o SCOUT21 foi desenhado para atacar.',
    keywords: [
      'SCOUT21',
      'plataforma gestão futsal',
      'software comissão técnica',
      'scout e fisiologia',
    ],
    coverImage: '/blog-covers/programacao-semanal-de-treinos-e-jogos-sem-whatsapp.jpg',
    blocks: [
      {
        type: 'p',
        text:
          'Software de gestão esportiva costuma fazer uma coisa bem e empurrar o resto para planilha. Scout em um lugar, bem-estar em outro, programação no WhatsApp. O SCOUT21 parte do oposto: comissão enxuta de futsal que precisa fechar o ciclo sem equipe de TI.',
      },
      { type: 'h2', text: 'Elenco e rotina' },
      {
        type: 'list',
        items: [
          'Cadastro com função, número, foto e histórico de lesões.',
          'Programação semanal que orienta o “foco do dia” no painel.',
          'Portal do atleta e Telegram para coleta de carga e bem-estar.',
        ],
      },
      { type: 'h2', text: 'Jogo e scout' },
      {
        type: 'list',
        items: [
          'Coleta ao vivo com doze tipos de evento e autosave.',
          'Lançamento pós-jogo pela súmula.',
          'Scout coletivo com filtros, RAIO-X e ranking em dezoito categorias.',
          'Export de relatório gerencial em PDF (plano PERFORMANCE).',
        ],
      },
      { type: 'h2', text: 'Fisiologia e inteligência' },
      {
        type: 'list',
        items: [
          'PSE e PSR de treino e jogo.',
          'Qualidade de sono e bem-estar diário.',
          'Score de prontidão, ACWR 7/28 e alertas interpretativos.',
          'Calculadora Jackson & Pollock 7 dobras pública — mesma fórmula da avaliação no elenco.',
          'Assistente com contexto do time, briefing pré-jogo e scout de adversário via link do YouTube.',
        ],
      },
      {
        type: 'callout',
        kind: 'warn',
        title: 'Transparência do roadmap',
        text:
          'Scout individual, quarteto, módulo atletas-fisio e musculação ainda aparecem como “Em breve” no produto. Não estão no trial como funcionalidade pronta. Offline na coleta também não — há autosave durante a sessão com conexão.',
      },
      { type: 'h2', text: 'Trial: como testar com seu clube' },
      {
        type: 'p',
        text:
          'Cadastro em scout21.com.br/criar-conta abre 30 dias no plano PERFORMANCE, sem cartão e sem cobrança automática ao final. Fisiologia fica liberada para testar adesão real do elenco. Se expirar, a conta vira leitura e export — não há surpresa de fatura.',
      },
      { type: 'h2', text: 'Para quem faz sentido' },
      {
        type: 'list',
        items: [
          'Comissões de futsal adulto e base com pouco tempo e sem analista em tempo integral.',
          'Clubes que já coletam PSE mas perdem o dado na planilha.',
          'Times universitários que precisam de scout + carga no mesmo orçamento de atenção.',
        ],
      },
      {
        type: 'quote',
        text: 'Não vendemos “operating system do esporte”. Vendemos menos retrabalho na semana do treinador.',
      },
      { type: 'h2', text: 'Próximo passo' },
      {
        type: 'p',
        text:
          'Monte o elenco, vincule o Telegram, registre um jogo e olhe a prontidão na manhã seguinte. Em uma semana você sabe se o fluxo cola no seu clube — não em slide de vendas.',
      },
      CTA('scout-fisiologia-elenco-scout21'),
    ],
  },
];
