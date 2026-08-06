export type UsageGuideTopicId =
  | 'comece-por-aqui'
  | 'cronometro'
  | 'eventos'
  | 'salvar-continuar'
  | 'finalizar-coleta'
  | 'problemas-comuns';

export interface UsageGuideStep {
  id: string;
  title: string;
  body: string;
  requiredState?: string;
  actionLabel?: string;
  expectedResult?: string;
  futureTargetTestId?: string;
  warning?: string;
}

export interface UsageGuideScenario {
  id: string;
  title: string;
  body: string;
  steps: string[];
  expectedResult?: string;
  warning?: string;
}

export interface UsageGuideComparison {
  id: string;
  title: string;
  items: string[];
}

export interface UsageGuideSection {
  id: UsageGuideTopicId;
  topic: string;
  title: string;
  summary: string;
  objective: string;
  whenToUse: string;
  steps: UsageGuideStep[];
  practicalTip?: string;
  warning?: string;
  relatedProblem?: string;
  nextTopicId?: UsageGuideTopicId;
  scenarios?: UsageGuideScenario[];
  comparisons?: UsageGuideComparison[];
}

export const USAGE_GUIDE_SECTIONS: UsageGuideSection[] = [
  {
    id: 'comece-por-aqui',
    topic: 'Comece por aqui',
    title: 'Comece por aqui',
    summary: 'Veja o ciclo completo da coleta antes de entrar nos detalhes.',
    objective: 'Ajudar um novo operador a entender o fluxo geral em poucos minutos.',
    whenToUse: 'Use esta seção antes da primeira partida ou quando precisar relembrar a ordem das etapas.',
    steps: [
      {
        id: 'choose-match',
        title: 'Escolha uma partida',
        body: 'Entre em Dados do Jogo e abra o card da partida que sera coletada.',
        actionLabel: 'Abrir a partida',
        expectedResult: 'O card da partida abre e mostra o caminho de coleta disponivel.',
        futureTargetTestId: 'match-card',
      },
      {
        id: 'check-players',
        title: 'Confira os atletas disponiveis',
        body: 'Antes de iniciar a coleta, confirme se os atletas da partida estao selecionados corretamente.',
        actionLabel: 'Confirmar atletas',
        expectedResult: 'A coleta pode ser iniciada sem faltar atletas da escalação.',
      },
      {
        id: 'open-collection',
        title: 'Abra a coleta',
        body: 'Para uma partida ao vivo, use Abrir Scout em Tempo Real. Para preencher depois da partida, use Adicionar dados da Partida.',
        actionLabel: 'Escolher o tipo de coleta',
        expectedResult: 'A tela de coleta abre no modo certo para a sua operacao.',
        futureTargetTestId: 'scouting-open-realtime',
      },
      {
        id: 'start-or-sync',
        title: 'Inicie ou sincronize o cronometro',
        body: 'Se a partida ainda nao começou, inicie normalmente. Se o jogo ja estiver rolando, use Sincronizar cronometro.',
        requiredState: 'Pre-jogo',
        actionLabel: 'INICIAR PARTIDA ou Sincronizar cronometro',
        expectedResult: 'O relogio passa a refletir o tempo oficial da quadra.',
        futureTargetTestId: 'clock-start',
      },
      {
        id: 'register-events',
        title: 'Registre os eventos',
        body: 'Selecione o atleta, depois o evento, depois os detalhes adicionais quando o fluxo pedir.',
        actionLabel: 'Registrar o evento',
        expectedResult: 'O evento aparece nos eventos recentes e no log completo.',
        futureTargetTestId: 'event-selector-pass',
      },
      {
        id: 'end-period-save',
        title: 'Encerre o periodo e salve',
        body: 'No fim do tempo, encerre o periodo correto. Depois escolha entre Salvar como incompleta ou Finalizar coleta.',
        actionLabel: 'Salvar ou finalizar',
        expectedResult: 'A partida fica pronta para continuar depois ou para ser concluida.',
        futureTargetTestId: 'save-match',
      },
    ],
    practicalTip: 'Se voce esta entrando no sistema pela primeira vez, leia esta seção inteira antes de abrir uma partida oficial.',
    relatedProblem: 'O operador pode tentar registrar eventos sem antes conferir o estado do relogio.',
    nextTopicId: 'cronometro',
  },
  {
    id: 'cronometro',
    topic: 'Cronometro da partida',
    title: 'Cronometro da partida',
    summary: 'Aprenda quando iniciar, pausar, sincronizar, encerrar e reabrir a coleta.',
    objective: 'Explicar o funcionamento do relogio oficial da coleta sem termos tecnicos.',
    whenToUse: 'Use esta seção quando estiver operando a partida ao vivo ou quando reabrir uma coleta incompleta.',
    steps: [
      {
        id: 'state-pre-game',
        title: 'Pre-jogo',
        body: 'Pre-jogo indica que a partida ainda nao começou. O sistema esta aguardando o inicio ou uma sincronizacao manual.',
        requiredState: 'Pre-jogo',
        expectedResult: 'Voce consegue iniciar a partida ou ajustar o tempo antes do primeiro evento.',
      },
      {
        id: 'start-match',
        title: 'Iniciar partida',
        body: 'Use INICIAR PARTIDA quando o jogo começar no sistema. Isso abre o primeiro tempo e libera o carimbo oficial dos eventos.',
        requiredState: 'Pre-jogo',
        actionLabel: 'INICIAR PARTIDA',
        expectedResult: 'O estado muda para Primeiro tempo.',
        futureTargetTestId: 'clock-start',
      },
      {
        id: 'pause-match',
        title: 'Pausar',
        body: 'Use PAUSAR para congelar o relogio no tempo atual quando a sua operacao exigir isso.',
        requiredState: 'Primeiro tempo ou Segundo tempo',
        actionLabel: 'PAUSAR',
        expectedResult: 'O estado muda para Partida pausada.',
        futureTargetTestId: 'clock-pause',
      },
      {
        id: 'continue-match',
        title: 'Continuar partida',
        body: 'Use CONTINUAR PARTIDA para retomar a coleta do mesmo tempo em que ela foi pausada.',
        requiredState: 'Partida pausada',
        actionLabel: 'CONTINUAR PARTIDA',
        expectedResult: 'O relogio volta a correr do ponto pausado.',
        futureTargetTestId: 'clock-continue',
      },
      {
        id: 'sync-clock',
        title: 'Sincronizar cronometro',
        body: 'Use Sincronizar cronometro quando o sistema precisar bater com o placar oficial da quadra. Informe o minuto e o segundo corretos e confirme.',
        actionLabel: 'Sincronizar cronometro',
        expectedResult: 'O relogio assume o tempo informado sem voce esperar a contagem alcancar esse ponto.',
        futureTargetTestId: 'clock-sync',
      },
      {
        id: 'end-first-half',
        title: 'Encerrar primeiro tempo',
        body: 'Quando o primeiro tempo termina, encerre a coleta do 1o tempo. O sistema leva a operacao para o intervalo.',
        requiredState: 'Primeiro tempo',
        actionLabel: 'Encerrar coleta do 1o tempo',
        expectedResult: 'O estado muda para Intervalo.',
        futureTargetTestId: 'clock-end-first-half',
      },
      {
        id: 'interval',
        title: 'Intervalo',
        body: 'No intervalo, confira o placar, o periodo e o tempo antes de seguir. Nao registre novos eventos de jogo sem iniciar a etapa seguinte.',
        requiredState: 'Intervalo',
        expectedResult: 'Voce prepara a volta da partida com o estado correto.',
      },
      {
        id: 'start-second-half',
        title: 'Iniciar segundo tempo',
        body: 'Use INICIAR SEGUNDO TEMPO para abrir a segunda etapa da partida.',
        requiredState: 'Intervalo',
        actionLabel: 'INICIAR SEGUNDO TEMPO',
        expectedResult: 'O estado muda para Segundo tempo.',
        futureTargetTestId: 'clock-start-second-half',
      },
      {
        id: 'end-match',
        title: 'Encerrar partida',
        body: 'Quando o jogo acaba, use Encerrar partida para travar o relogio no estado final e liberar a finalizacao da coleta.',
        requiredState: 'Segundo tempo',
        actionLabel: 'Encerrar partida',
        expectedResult: 'O estado muda para Partida encerrada.',
        futureTargetTestId: 'clock-end-match',
      },
      {
        id: 'save-incomplete',
        title: 'Salvar como incompleta',
        body: 'Se voce precisar sair antes do fim, use Salvar como incompleta. A partida fica pronta para ser retomada depois.',
        actionLabel: 'Salvar como incompleta',
        expectedResult: 'Periodo, relogio, placar e eventos ficam preservados.',
        futureTargetTestId: 'save-match',
      },
      {
        id: 'reopen-match',
        title: 'Reabrir uma partida incompleta',
        body: 'Ao retomar uma coleta incompleta, o relogio volta no tempo salvo e abre pausado. Confira o tempo e o periodo antes de continuar.',
        actionLabel: 'Retomar Coleta',
        expectedResult: 'Voce retoma a operacao com placar, eventos e periodo preservados.',
        futureTargetTestId: 'reopen-match',
        warning: 'Sempre confira o periodo e o tempo antes de voltar a registrar eventos.',
      },
      {
        id: 'finish-collection',
        title: 'Finalizar coleta',
        body: 'Use Finalizar coleta somente quando a partida ja estiver encerrada e voce nao precisar mais continuar a operacao.',
        requiredState: 'Partida encerrada',
        actionLabel: 'Finalizar coleta',
        expectedResult: 'A coleta e concluida no fluxo operacional atual.',
        futureTargetTestId: 'end-collection',
      },
    ],
    practicalTip: 'Se o relogio nao estiver batendo com a quadra, sincronize antes de continuar a registrar novos eventos.',
    warning: 'Nao invente tempo manual em uma partida ao vivo quando o produto oferece sincronizacao.',
    relatedProblem: 'O erro mais comum e continuar a coleta sem conferir se o relogio reabriu no tempo salvo.',
    nextTopicId: 'eventos',
    scenarios: [
      {
        id: 'scenario-00-00',
        title: 'O jogo ja começou e o sistema ainda esta em 00:00',
        body: 'Nao espere o relogio correr ate alcançar o tempo certo.',
        steps: [
          'Abra Sincronizar cronometro.',
          'Informe o periodo correto.',
          'Digite o minuto e o segundo oficiais da quadra.',
          'Confirme e siga com a coleta.',
        ],
        expectedResult: 'O relogio passa a refletir o tempo oficial da quadra.',
      },
      {
        id: 'scenario-different-clock',
        title: 'O tempo da plataforma esta diferente do placar da quadra',
        body: 'Ajuste a plataforma antes que o erro se espalhe para os proximos eventos.',
        steps: [
          'Pause a partida se isso fizer parte da sua operacao.',
          'Abra Sincronizar cronometro.',
          'Informe o tempo correto.',
          'Confirme e retome a partida.',
        ],
      },
      {
        id: 'scenario-leave-early',
        title: 'Preciso sair antes do fim',
        body: 'Saia de forma segura para outra pessoa conseguir continuar depois.',
        steps: [
          'Confirme periodo, tempo e placar.',
          'Use Salvar como incompleta.',
          'Feche a coleta.',
          'Retome a partida depois pelo botao Retomar Coleta.',
        ],
        expectedResult: 'A coleta pode ser continuada depois sem perder o andamento.',
      },
      {
        id: 'scenario-reopened',
        title: 'Reabri uma partida incompleta',
        body: 'A reabertura deve trazer o que foi salvo e manter o relogio pausado.',
        steps: [
          'Abra a partida por Retomar Coleta.',
          'Confira o periodo mostrado.',
          'Confira o tempo salvo.',
          'Decida entre continuar ou sincronizar antes de seguir.',
        ],
      },
      {
        id: 'scenario-finish-disabled',
        title: 'O botao Finalizar coleta esta desabilitado',
        body: 'Isso normalmente significa que a partida ainda nao foi encerrada no fluxo do cronometro.',
        steps: [
          'Confirme se o jogo ja chegou ao estado Partida encerrada.',
          'Se ainda estiver em segundo tempo, encerre a partida.',
          'Depois volte para a area de finalizacao.',
        ],
        warning: 'Nao tente finalizar antes do encerramento correto da partida.',
      },
    ],
  },
  {
    id: 'eventos',
    topic: 'Registro de eventos',
    title: 'Registro de eventos',
    summary: 'Veja a ordem real da coleta para eventos no produto atual.',
    objective: 'Reduzir erros de operacao na hora de registrar eventos.',
    whenToUse: 'Use esta seção durante a operacao para confirmar a ordem certa do preenchimento.',
    steps: [
      {
        id: 'choose-player',
        title: 'Selecione o atleta',
        body: 'Escolha primeiro o atleta ligado ao lance. No fluxo atual, o atleta vem antes do evento.',
        expectedResult: 'O sistema sabe para quem o registro sera atribuido.',
      },
      {
        id: 'choose-event',
        title: 'Selecione o evento',
        body: 'Depois escolha o tipo de lance, como passe, finalizacao, falta, gol, defesa ou outro evento disponivel.',
        expectedResult: 'O fluxo exibe os detalhes necessarios para esse evento.',
      },
      {
        id: 'fill-details',
        title: 'Preencha os detalhes adicionais',
        body: 'Alguns eventos pedem resultado, assistencia, zona, cobrador ou outros dados complementares.',
        expectedResult: 'O evento fica completo para salvar e para aparecer no log.',
      },
      {
        id: 'confirm-event',
        title: 'Confirme o registro',
        body: 'Depois da confirmacao, confira se o evento apareceu na lista de eventos recentes.',
        expectedResult: 'O evento aparece nos eventos recentes e no log completo.',
        futureTargetTestId: 'logs-open',
      },
      {
        id: 'review-log',
        title: 'Revise no log completo',
        body: 'Se surgir qualquer duvida, abra o log completo para conferir o horario, o periodo e o texto do evento.',
        actionLabel: 'Abrir log completo',
        expectedResult: 'Voce confere rapidamente o que foi salvo na tela.',
        futureTargetTestId: 'logs-open',
      },
    ],
    practicalTip: 'Quando a jogada acontecer muito rapido, primeiro garanta o atleta correto. Depois refine os detalhes com calma.',
    relatedProblem: 'O operador pode se perder quando tenta lembrar o evento antes de confirmar o atleta.',
    nextTopicId: 'salvar-continuar',
  },
  {
    id: 'salvar-continuar',
    topic: 'Salvar e continuar depois',
    title: 'Salvar e continuar depois',
    summary: 'Entenda a diferenca entre interromper com seguranca e apenas revisar dados.',
    objective: 'Explicar quando usar Salvar como incompleta, Retomar Coleta e Editar Dados.',
    whenToUse: 'Use esta seção quando a partida nao puder ser concluida de uma vez ou quando voce reabrir um card salvo.',
    steps: [
      {
        id: 'save-incomplete-step',
        title: 'Salvar como incompleta',
        body: 'Use Salvar como incompleta quando a coleta vai continuar depois.',
        actionLabel: 'Salvar como incompleta',
        expectedResult: 'A partida volta para o dashboard com relogio, placar, periodo e eventos preservados.',
      },
      {
        id: 'reopen-incomplete',
        title: 'Retomar Coleta',
        body: 'Use Retomar Coleta para continuar a operacao da partida. O relogio abre pausado no tempo salvo.',
        actionLabel: 'Retomar Coleta',
        expectedResult: 'Voce segue do mesmo ponto operacional da coleta.',
      },
      {
        id: 'edit-match-data',
        title: 'Editar Dados da partida',
        body: 'Use Editar Dados quando o objetivo for revisar ou complementar informacoes da partida, e nao retomar a operacao ao vivo.',
        actionLabel: 'Editar Dados',
        expectedResult: 'Voce revisa dados e registros sem depender da continuidade operacional da coleta.',
      },
      {
        id: 'check-before-continue',
        title: 'Confira antes de continuar',
        body: 'Depois de reabrir, confira sempre o periodo, o tempo e o placar antes de voltar a registrar eventos.',
        expectedResult: 'A partida continua do ponto certo, sem duplicar ou deslocar lances.',
      },
    ],
    practicalTip: 'Se a coleta vai seguir depois, pense em Retomar Coleta. Se o objetivo e revisar, pense em Editar Dados.',
    warning: 'Nao trate Editar Dados como se fosse a continuidade operacional do jogo ao vivo.',
    relatedProblem: 'Confundir Retomar Coleta com Editar Dados pode levar a uma decisao errada na hora de reabrir a partida.',
    nextTopicId: 'finalizar-coleta',
    comparisons: [
      {
        id: 'resume-vs-edit',
        title: 'Retomar Coleta',
        items: [
          'Continua a operacao da partida.',
          'Restaura periodo, relogio, placar e eventos.',
          'Abre o cronometro pausado para voce decidir como seguir.',
        ],
      },
      {
        id: 'edit-vs-resume',
        title: 'Editar Dados da partida',
        items: [
          'Serve para revisar ou complementar informacoes.',
          'Nao representa a continuidade operacional da coleta ao vivo.',
          'Deve ser usado quando a sua intencao nao e retomar o fluxo do relogio.',
        ],
      },
    ],
  },
  {
    id: 'finalizar-coleta',
    topic: 'Finalizar a coleta',
    title: 'Finalizar a coleta',
    summary: 'Saiba quando a coleta pode ser encerrada de forma definitiva.',
    objective: 'Evitar o fechamento prematuro da coleta.',
    whenToUse: 'Use esta seção ao fim da partida, depois que o cronometro estiver encerrado.',
    steps: [
      {
        id: 'finish-precondition',
        title: 'Confirme o encerramento da partida',
        body: 'Antes de finalizar, confirme que o cronometro ja chegou ao estado Partida encerrada.',
        requiredState: 'Partida encerrada',
        expectedResult: 'O botao Finalizar coleta fica pronto para uso.',
      },
      {
        id: 'review-data',
        title: 'Revise os dados essenciais',
        body: 'Confira placar, periodo final e eventos mais recentes antes de concluir.',
        expectedResult: 'Voce reduz o risco de fechar a coleta com um erro visivel.',
      },
      {
        id: 'finish-action',
        title: 'Finalize a coleta',
        body: 'Use Finalizar coleta apenas quando nao houver mais continuidade operacional.',
        actionLabel: 'Finalizar coleta',
        expectedResult: 'O processo operacional da coleta e concluido.',
        futureTargetTestId: 'end-collection',
      },
    ],
    practicalTip: 'Se ainda existe chance de a partida continuar depois, prefira Salvar como incompleta.',
    relatedProblem: 'O operador pode tentar finalizar antes do encerramento real da partida.',
    nextTopicId: 'problemas-comuns',
  },
  {
    id: 'problemas-comuns',
    topic: 'Problemas comuns',
    title: 'Problemas comuns',
    summary: 'Respostas curtas para duvidas operacionais frequentes.',
    objective: 'Resolver bloqueios comuns sem depender da equipe em tempo real.',
    whenToUse: 'Use esta seção quando algo parecer estranho durante a operacao.',
    steps: [
      {
        id: 'problem-wrong-time',
        title: 'O relogio nao bate com a quadra',
        body: 'Abra Sincronizar cronometro e ajuste o minuto e o segundo oficiais.',
        expectedResult: 'O tempo da coleta volta a bater com o jogo.',
      },
      {
        id: 'problem-finish-disabled',
        title: 'Finalizar coleta esta desabilitado',
        body: 'Encerrar a partida e a condicao real antes de tentar finalizar.',
        expectedResult: 'Depois do encerramento correto, a finalizacao fica disponivel.',
      },
      {
        id: 'problem-reopen',
        title: 'Reabri a partida e quero seguir com seguranca',
        body: 'Confira tempo, periodo e placar. Se algo nao bater com a quadra, sincronize antes de registrar novo evento.',
        expectedResult: 'A coleta segue do ponto correto.',
      },
      {
        id: 'problem-edit-vs-resume',
        title: 'Nao sei se devo usar Retomar Coleta ou Editar Dados',
        body: 'Retomar Coleta continua a operacao. Editar Dados revisa ou complementa informacoes da partida.',
        expectedResult: 'Voce escolhe o caminho certo para a sua necessidade.',
      },
    ],
    practicalTip: 'Se a duvida envolve tempo ou periodo, confira primeiro o relogio e o estado atual da partida.',
    warning: 'Se o comportamento da tela nao bater com esta ajuda, pare, confira a partida e documente o caso antes de seguir.',
  },
];

export const USAGE_GUIDE_SECTION_ORDER: UsageGuideTopicId[] = USAGE_GUIDE_SECTIONS.map((section) => section.id);

export function getUsageGuideSection(topicId: UsageGuideTopicId): UsageGuideSection {
  return (
    USAGE_GUIDE_SECTIONS.find((section) => section.id === topicId) ??
    USAGE_GUIDE_SECTIONS[0]
  );
}
