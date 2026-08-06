export type ClockTourTargetId =
  | 'match-clock-panel'
  | 'clock-primary'
  | 'clock-sync'
  | 'player-selector-panel'
  | 'event-selector-pass'
  | 'save-match'
  | 'end-collection';

export type ClockTourStepRole = 'welcome' | 'current' | 'flow' | 'outro';

export interface ClockTourStepDefinition {
  id: string;
  role: ClockTourStepRole;
  title: string;
  body: string;
  targetId?: ClockTourTargetId;
  hint?: string;
}

interface BuildClockTourOptions {
  clockState:
    | 'PRE_JOGO'
    | 'PRIMEIRO_TEMPO'
    | 'PAUSADO'
    | 'SINCRONIZANDO'
    | 'INTERVALO'
    | 'SEGUNDO_TEMPO'
    | 'ENCERRADO';
  currentPeriod: '1T' | '2T';
  hasClockSyncFallback: boolean;
  isMatchStarted: boolean;
  canShowPlayerStep: boolean;
  canShowPassStep: boolean;
  canSaveIncomplete: boolean;
  canFinishCollection: boolean;
}

const WELCOME_STEP: ClockTourStepDefinition = {
  id: 'welcome',
  role: 'welcome',
  title: 'Bem-vindo ao tour',
  body: 'Este tour acompanha a partida aberta, destaca o controle do momento e nao trava sua operacao.',
  targetId: 'match-clock-panel',
  hint: 'Relogio oficial da coleta',
};

const START_MATCH_STEP: ClockTourStepDefinition = {
  id: 'start-match',
  role: 'current',
  title: 'Comece por aqui',
  body: 'A partida ainda esta em pre-jogo. Use o botao principal para iniciar o cronometro quando a coleta estiver pronta.',
  targetId: 'clock-primary',
  hint: 'Botao principal do relogio',
};

const SYNC_CLOCK_STEP: ClockTourStepDefinition = {
  id: 'sync-clock',
  role: 'current',
  title: 'Sincronize antes de seguir',
  body: 'Se o tempo da tela nao bate com a quadra, sincronize o relogio antes de registrar novos eventos.',
  targetId: 'clock-sync',
  hint: 'Botao de sincronizacao',
};

const PAUSE_MATCH_STEP: ClockTourStepDefinition = {
  id: 'pause-match',
  role: 'current',
  title: 'Quando precisar parar',
  body: 'Com a partida em andamento, este botao pausa o relogio sem tirar voce da coleta.',
  targetId: 'clock-primary',
  hint: 'Botao principal do relogio',
};

const CONTINUE_MATCH_STEP: ClockTourStepDefinition = {
  id: 'continue-match',
  role: 'current',
  title: 'Retome do ponto salvo',
  body: 'Quando o relogio estiver pausado, continue por aqui para voltar ao mesmo tempo da coleta.',
  targetId: 'clock-primary',
  hint: 'Botao principal do relogio',
};

const START_SECOND_HALF_STEP: ClockTourStepDefinition = {
  id: 'start-second-half',
  role: 'current',
  title: 'Volta do intervalo',
  body: 'No intervalo, o proximo passo operacional e abrir o segundo tempo pelo botao principal.',
  targetId: 'clock-primary',
  hint: 'Botao principal do relogio',
};

const FINISH_COLLECTION_STEP: ClockTourStepDefinition = {
  id: 'finish-collection',
  role: 'current',
  title: 'Feche a coleta com seguranca',
  body: 'Depois de encerrar a partida no relogio, finalize a coleta por este atalho.',
  targetId: 'end-collection',
  hint: 'Botao Finalizar coleta',
};

const SELECT_PLAYER_STEP: ClockTourStepDefinition = {
  id: 'select-player',
  role: 'flow',
  title: 'Primeiro escolha o atleta',
  body: 'No fluxo atual da coleta, o atleta vem antes do evento. Use a coluna da esquerda para selecionar quem participou do lance.',
  targetId: 'player-selector-panel',
  hint: 'Painel de atletas',
};

const REGISTER_PASS_STEP: ClockTourStepDefinition = {
  id: 'register-pass',
  role: 'flow',
  title: 'Depois registre um evento simples',
  body: 'Para um primeiro registro seguro, selecione um passe. O resto do fluxo segue a coleta real da partida.',
  targetId: 'event-selector-pass',
  hint: 'Botao PASSE',
};

const SAVE_INCOMPLETE_STEP: ClockTourStepDefinition = {
  id: 'save-incomplete',
  role: 'flow',
  title: 'Precisa sair antes do fim?',
  body: 'Salvar como incompleta preserva relogio, placar, periodo e eventos para a retomada depois.',
  targetId: 'save-match',
  hint: 'Botao Salvar como incompleta',
};

const DONE_STEP: ClockTourStepDefinition = {
  id: 'done',
  role: 'outro',
  title: 'Tour concluido',
  body: 'Voce pode seguir a coleta normalmente, rever este tour quando quiser ou abrir o guia completo como referencia.',
  targetId: 'match-clock-panel',
  hint: 'Relogio oficial da coleta',
};

function dedupeSteps(steps: ClockTourStepDefinition[]): ClockTourStepDefinition[] {
  const seen = new Set<string>();
  return steps.filter((step) => {
    if (seen.has(step.id)) return false;
    seen.add(step.id);
    return true;
  });
}

function getCurrentClockStep(options: BuildClockTourOptions): ClockTourStepDefinition {
  if (options.hasClockSyncFallback || options.clockState === 'SINCRONIZANDO') {
    return SYNC_CLOCK_STEP;
  }

  switch (options.clockState) {
    case 'PRE_JOGO':
      return START_MATCH_STEP;
    case 'PAUSADO':
      return CONTINUE_MATCH_STEP;
    case 'INTERVALO':
      return START_SECOND_HALF_STEP;
    case 'ENCERRADO':
      return FINISH_COLLECTION_STEP;
    case 'SEGUNDO_TEMPO':
    case 'PRIMEIRO_TEMPO':
    default:
      return PAUSE_MATCH_STEP;
  }
}

export function buildClockProductTourSteps(
  options: BuildClockTourOptions
): ClockTourStepDefinition[] {
  const steps: ClockTourStepDefinition[] = [WELCOME_STEP, getCurrentClockStep(options)];

  if (options.isMatchStarted && options.canShowPlayerStep) {
    steps.push(SELECT_PLAYER_STEP);
  }

  if (options.canShowPassStep) {
    steps.push(REGISTER_PASS_STEP);
  }

  if (options.canFinishCollection) {
    steps.push(FINISH_COLLECTION_STEP);
  } else if (options.canSaveIncomplete) {
    steps.push(SAVE_INCOMPLETE_STEP);
  }

  steps.push(DONE_STEP);

  return dedupeSteps(steps);
}
