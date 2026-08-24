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
        body: 'Entre em Dados do Jogo e abra o card da partida que será coletada.',
        actionLabel: 'Abrir a partida',
        expectedResult: 'O card da partida abre e mostra o caminho de coleta disponível.',
        futureTargetTestId: 'match-card',
      },
      {
        id: 'check-players',
        title: 'Confira os atletas disponíveis',
        body: 'Antes de iniciar a coleta, confirme se os atletas da partida estão selecionados corretamente.',
        actionLabel: 'Confirmar atletas',
        expectedResult: 'A coleta pode ser iniciada sem faltar atletas da escalação.',
      },
      {
        id: 'open-collection',
        title: 'Abra a coleta',
        body: 'Para uma partida ao vivo, use Abrir Scout em Tempo Real. Para preencher depois da partida, use Adicionar dados da Partida.',
        actionLabel: 'Escolher o tipo de coleta',
        expectedResult: 'A tela de coleta abre no modo certo para a sua operação.',
        futureTargetTestId: 'scouting-open-realtime',
      },
      {
        id: 'start-or-sync',
        title: 'Inicie ou sincronize o cronômetro',
        body: 'Se a partida ainda não começou, inicie normalmente. Se o jogo já estiver rolando, use Sincronizar cronômetro.',
        requiredState: 'Pré-jogo',
        actionLabel: 'INICIAR PARTIDA ou Sincronizar cronômetro',
        expectedResult: 'O relógio passa a refletir o tempo oficial da quadra.',
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
        title: 'Encerre o período e salve',
        body: 'No fim do tempo, encerre o período correto. Depois escolha entre Salvar como incompleta ou Finalizar coleta.',
        actionLabel: 'Salvar ou finalizar',
        expectedResult: 'A partida fica pronta para continuar depois ou para ser concluída.',
        futureTargetTestId: 'save-match',
      },
    ],
    practicalTip: 'Se você está entrando no sistema pela primeira vez, leia esta seção inteira antes de abrir uma partida oficial.',
    relatedProblem: 'O operador pode tentar registrar eventos sem antes conferir o estado do relógio.',
    nextTopicId: 'cronometro',
  },
  {
    id: 'cronometro',
    topic: 'Cronômetro da partida',
    title: 'Cronômetro da partida',
    summary: 'Aprenda quando iniciar, pausar, sincronizar, encerrar e reabrir a coleta.',
    objective: 'Explicar o funcionamento do relógio oficial da coleta sem termos técnicos.',
    whenToUse: 'Use esta seção quando estiver operando a partida ao vivo ou quando reabrir uma coleta incompleta.',
    steps: [
      {
        id: 'state-pre-game',
        title: 'Pré-jogo',
        body: 'Pré-jogo indica que a partida ainda não começou. O sistema está aguardando o início ou uma sincronização manual.',
        requiredState: 'Pré-jogo',
        expectedResult: 'Você consegue iniciar a partida ou ajustar o tempo antes do primeiro evento.',
      },
      {
        id: 'start-match',
        title: 'Iniciar partida',
        body: 'Use INICIAR PARTIDA quando o jogo começar no sistema. Isso abre o primeiro tempo e libera o carimbo oficial dos eventos.',
        requiredState: 'Pré-jogo',
        actionLabel: 'INICIAR PARTIDA',
        expectedResult: 'O estado muda para Primeiro tempo.',
        futureTargetTestId: 'clock-start',
      },
      {
        id: 'pause-match',
        title: 'Pausar',
        body: 'Use PAUSAR para congelar o relógio no tempo atual quando a sua operação exigir isso.',
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
        expectedResult: 'O relógio volta a correr do ponto pausado.',
        futureTargetTestId: 'clock-continue',
      },
      {
        id: 'sync-clock',
        title: 'Sincronizar cronômetro',
        body: 'Use Sincronizar cronômetro quando o sistema precisar bater com o placar oficial da quadra. Informe o minuto e o segundo corretos e confirme.',
        actionLabel: 'Sincronizar cronômetro',
        expectedResult: 'O relógio assume o tempo informado sem você esperar a contagem alcançar esse ponto.',
        futureTargetTestId: 'clock-sync',
      },
      {
        id: 'end-first-half',
        title: 'Encerrar primeiro tempo',
        body: 'Quando o primeiro tempo termina, encerre a coleta do 1º tempo. O sistema leva a operação para o intervalo.',
        requiredState: 'Primeiro tempo',
        actionLabel: 'Encerrar coleta do 1º tempo',
        expectedResult: 'O estado muda para Intervalo.',
        futureTargetTestId: 'clock-end-first-half',
      },
      {
        id: 'interval',
        title: 'Intervalo',
        body: 'No intervalo, confira o placar, o período e o tempo antes de seguir. Não registre novos eventos de jogo sem iniciar a etapa seguinte.',
        requiredState: 'Intervalo',
        expectedResult: 'Você prepara a volta da partida com o estado correto.',
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
        body: 'Quando o jogo acaba, use Encerrar partida para travar o relógio no estado final e liberar a finalização da coleta.',
        requiredState: 'Segundo tempo',
        actionLabel: 'Encerrar partida',
        expectedResult: 'O estado muda para Partida encerrada.',
        futureTargetTestId: 'clock-end-match',
      },
      {
        id: 'save-incomplete',
        title: 'Salvar como incompleta',
        body: 'Se você precisar sair antes do fim, use Salvar como incompleta. A partida fica pronta para ser retomada depois.',
        actionLabel: 'Salvar como incompleta',
        expectedResult: 'Período, relógio, placar e eventos ficam preservados.',
        futureTargetTestId: 'save-match',
      },
      {
        id: 'reopen-match',
        title: 'Reabrir uma partida incompleta',
        body: 'Ao retomar uma coleta incompleta, o relógio volta no tempo salvo e abre pausado. Confira o tempo e o período antes de continuar.',
        actionLabel: 'Retomar Coleta',
        expectedResult: 'Você retoma a operação com placar, eventos e período preservados.',
        futureTargetTestId: 'reopen-match',
        warning: 'Sempre confira o período e o tempo antes de voltar a registrar eventos.',
      },
      {
        id: 'finish-collection',
        title: 'Finalizar coleta',
        body: 'Use Finalizar coleta somente quando a partida já estiver encerrada e você não precisar mais continuar a operação.',
        requiredState: 'Partida encerrada',
        actionLabel: 'Finalizar coleta',
        expectedResult: 'A coleta é concluída no fluxo operacional atual.',
        futureTargetTestId: 'end-collection',
      },
    ],
    practicalTip: 'Se o relógio não estiver batendo com a quadra, sincronize antes de continuar a registrar novos eventos.',
    warning: 'Não invente tempo manual em uma partida ao vivo quando o produto oferece sincronização.',
    relatedProblem: 'O erro mais comum é continuar a coleta sem conferir se o relógio reabriu no tempo salvo.',
    nextTopicId: 'eventos',
    scenarios: [
      {
        id: 'scenario-00-00',
        title: 'O jogo já começou e o sistema ainda está em 00:00',
        body: 'Não espere o relógio correr até alcançar o tempo certo.',
        steps: [
          'Abra Sincronizar cronômetro.',
          'Informe o período correto.',
          'Digite o minuto e o segundo oficiais da quadra.',
          'Confirme e siga com a coleta.',
        ],
        expectedResult: 'O relógio passa a refletir o tempo oficial da quadra.',
      },
      {
        id: 'scenario-different-clock',
        title: 'O tempo da plataforma está diferente do placar da quadra',
        body: 'Ajuste a plataforma antes que o erro se espalhe para os próximos eventos.',
        steps: [
          'Pause a partida se isso fizer parte da sua operação.',
          'Abra Sincronizar cronômetro.',
          'Informe o tempo correto.',
          'Confirme e retome a partida.',
        ],
      },
      {
        id: 'scenario-leave-early',
        title: 'Preciso sair antes do fim',
        body: 'Saia de forma segura para outra pessoa conseguir continuar depois.',
        steps: [
          'Confirme período, tempo e placar.',
          'Use Salvar como incompleta.',
          'Feche a coleta.',
          'Retome a partida depois pelo botão Retomar Coleta.',
        ],
        expectedResult: 'A coleta pode ser continuada depois sem perder o andamento.',
      },
      {
        id: 'scenario-reopened',
        title: 'Reabri uma partida incompleta',
        body: 'A reabertura deve trazer o que foi salvo e manter o relógio pausado.',
        steps: [
          'Abra a partida por Retomar Coleta.',
          'Confira o período mostrado.',
          'Confira o tempo salvo.',
          'Decida entre continuar ou sincronizar antes de seguir.',
        ],
      },
      {
        id: 'scenario-finish-disabled',
        title: 'O botão Finalizar coleta está desabilitado',
        body: 'Isso normalmente significa que a partida ainda não foi encerrada no fluxo do cronômetro.',
        steps: [
          'Confirme se o jogo já chegou ao estado Partida encerrada.',
          'Se ainda estiver em segundo tempo, encerre a partida.',
          'Depois volte para a área de finalização.',
        ],
        warning: 'Não tente finalizar antes do encerramento correto da partida.',
      },
    ],
  },
  {
    id: 'eventos',
    topic: 'Registro de eventos',
    title: 'Registro de eventos',
    summary: 'Veja a ordem real da coleta para eventos no produto atual.',
    objective: 'Reduzir erros de operação na hora de registrar eventos.',
    whenToUse: 'Use esta seção durante a operação para confirmar a ordem certa do preenchimento.',
    steps: [
      {
        id: 'choose-player',
        title: 'Selecione o atleta',
        body: 'Escolha primeiro o atleta ligado ao lance. No fluxo atual, o atleta vem antes do evento.',
        expectedResult: 'O sistema sabe para quem o registro será atribuído.',
      },
      {
        id: 'choose-event',
        title: 'Selecione o evento',
        body: 'Depois escolha o tipo de lance, como passe, finalização, falta, gol, defesa ou outro evento disponível.',
        expectedResult: 'O fluxo exibe os detalhes necessários para esse evento.',
      },
      {
        id: 'fill-details',
        title: 'Preencha os detalhes adicionais',
        body: 'Alguns eventos pedem resultado, assistência, zona, cobrador ou outros dados complementares.',
        expectedResult: 'O evento fica completo para salvar e para aparecer no log.',
      },
      {
        id: 'confirm-event',
        title: 'Confirme o registro',
        body: 'Depois da confirmação, confira se o evento apareceu na lista de eventos recentes.',
        expectedResult: 'O evento aparece nos eventos recentes e no log completo.',
        futureTargetTestId: 'logs-open',
      },
      {
        id: 'review-log',
        title: 'Revise no log completo',
        body: 'Se surgir qualquer dúvida, abra o log completo para conferir o horário, o período e o texto do evento.',
        actionLabel: 'Abrir log completo',
        expectedResult: 'Você confere rapidamente o que foi salvo na tela.',
        futureTargetTestId: 'logs-open',
      },
    ],
    practicalTip: 'Quando a jogada acontecer muito rápido, primeiro garanta o atleta correto. Depois refine os detalhes com calma.',
    relatedProblem: 'O operador pode se perder quando tenta lembrar o evento antes de confirmar o atleta.',
    nextTopicId: 'salvar-continuar',
  },
  {
    id: 'salvar-continuar',
    topic: 'Salvar e continuar depois',
    title: 'Salvar e continuar depois',
    summary: 'Entenda a diferença entre interromper com segurança e apenas revisar dados.',
    objective: 'Explicar quando usar Salvar como incompleta, Retomar Coleta e Editar Dados.',
    whenToUse: 'Use esta seção quando a partida não puder ser concluída de uma vez ou quando você reabrir um card salvo.',
    steps: [
      {
        id: 'save-incomplete-step',
        title: 'Salvar como incompleta',
        body: 'Use Salvar como incompleta quando a coleta vai continuar depois.',
        actionLabel: 'Salvar como incompleta',
        expectedResult: 'A partida volta para o dashboard com relógio, placar, período e eventos preservados.',
      },
      {
        id: 'reopen-incomplete',
        title: 'Retomar Coleta',
        body: 'Use Retomar Coleta para continuar a operação da partida. O relógio abre pausado no tempo salvo.',
        actionLabel: 'Retomar Coleta',
        expectedResult: 'Você segue do mesmo ponto operacional da coleta.',
      },
      {
        id: 'edit-match-data',
        title: 'Editar Dados da partida',
        body: 'Use Editar Dados quando o objetivo for revisar ou complementar informações da partida, e não retomar a operação ao vivo.',
        actionLabel: 'Editar Dados',
        expectedResult: 'Você revisa dados e registros sem depender da continuidade operacional da coleta.',
      },
      {
        id: 'check-before-continue',
        title: 'Confira antes de continuar',
        body: 'Depois de reabrir, confira sempre o período, o tempo e o placar antes de voltar a registrar eventos.',
        expectedResult: 'A partida continua do ponto certo, sem duplicar ou deslocar lances.',
      },
    ],
    practicalTip: 'Se a coleta vai seguir depois, pense em Retomar Coleta. Se o objetivo é revisar, pense em Editar Dados.',
    warning: 'Não trate Editar Dados como se fosse a continuidade operacional do jogo ao vivo.',
    relatedProblem: 'Confundir Retomar Coleta com Editar Dados pode levar a uma decisão errada na hora de reabrir a partida.',
    nextTopicId: 'finalizar-coleta',
    comparisons: [
      {
        id: 'resume-vs-edit',
        title: 'Retomar Coleta',
        items: [
          'Continua a operação da partida.',
          'Restaura período, relógio, placar e eventos.',
          'Abre o cronômetro pausado para você decidir como seguir.',
        ],
      },
      {
        id: 'edit-vs-resume',
        title: 'Editar Dados da partida',
        items: [
          'Serve para revisar ou complementar informações.',
          'Não representa a continuidade operacional da coleta ao vivo.',
          'Deve ser usado quando a sua intenção não é retomar o fluxo do relógio.',
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
    whenToUse: 'Use esta seção ao fim da partida, depois que o cronômetro estiver encerrado.',
    steps: [
      {
        id: 'finish-precondition',
        title: 'Confirme o encerramento da partida',
        body: 'Antes de finalizar, confirme que o cronômetro já chegou ao estado Partida encerrada.',
        requiredState: 'Partida encerrada',
        expectedResult: 'O botão Finalizar coleta fica pronto para uso.',
      },
      {
        id: 'review-data',
        title: 'Revise os dados essenciais',
        body: 'Confira placar, período final e eventos mais recentes antes de concluir.',
        expectedResult: 'Você reduz o risco de fechar a coleta com um erro visível.',
      },
      {
        id: 'finish-action',
        title: 'Finalize a coleta',
        body: 'Use Finalizar coleta apenas quando não houver mais continuidade operacional.',
        actionLabel: 'Finalizar coleta',
        expectedResult: 'O processo operacional da coleta é concluído.',
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
    summary: 'Respostas curtas para dúvidas operacionais frequentes.',
    objective: 'Resolver bloqueios comuns sem depender da equipe em tempo real.',
    whenToUse: 'Use esta seção quando algo parecer estranho durante a operação.',
    steps: [
      {
        id: 'problem-wrong-time',
        title: 'O relógio não bate com a quadra',
        body: 'Abra Sincronizar cronômetro e ajuste o minuto e o segundo oficiais.',
        expectedResult: 'O tempo da coleta volta a bater com o jogo.',
      },
      {
        id: 'problem-finish-disabled',
        title: 'Finalizar coleta está desabilitado',
        body: 'Encerrar a partida é a condição real antes de tentar finalizar.',
        expectedResult: 'Depois do encerramento correto, a finalização fica disponível.',
      },
      {
        id: 'problem-reopen',
        title: 'Reabri a partida e quero seguir com segurança',
        body: 'Confira tempo, período e placar. Se algo não bater com a quadra, sincronize antes de registrar novo evento.',
        expectedResult: 'A coleta segue do ponto correto.',
      },
      {
        id: 'problem-edit-vs-resume',
        title: 'Não sei se devo usar Retomar Coleta ou Editar Dados',
        body: 'Retomar Coleta continua a operação. Editar Dados revisa ou complementa informações da partida.',
        expectedResult: 'Você escolhe o caminho certo para a sua necessidade.',
      },
    ],
    practicalTip: 'Se a dúvida envolve tempo ou período, confira primeiro o relógio e o estado atual da partida.',
    warning: 'Se o comportamento da tela não bater com esta ajuda, pare, confira a partida e documente o caso antes de seguir.',
  },
];

export const USAGE_GUIDE_SECTION_ORDER: UsageGuideTopicId[] = USAGE_GUIDE_SECTIONS.map((section) => section.id);

export function getUsageGuideSection(topicId: UsageGuideTopicId): UsageGuideSection {
  return (
    USAGE_GUIDE_SECTIONS.find((section) => section.id === topicId) ??
    USAGE_GUIDE_SECTIONS[0]
  );
}
