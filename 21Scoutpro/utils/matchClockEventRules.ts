export type MatchClockEventType =
  | 'pass'
  | 'shot'
  | 'foul'
  | 'goal'
  | 'card'
  | 'tackle'
  | 'save'
  | 'block'
  | 'corner'
  | 'freeKick'
  | 'penalty'
  | 'lateral';

export type MatchClockShotResult = 'inside' | 'outside' | 'post' | 'blocked';

export type ClockPauseDirective = 'none' | 'manual' | 'event' | 'preserve-current';

export interface MatchClockEventRule {
  pauseBeforeFlow: ClockPauseDirective;
  pauseAfterRegister: ClockPauseDirective;
  exigeConfirmacao: boolean;
  validada: boolean;
  observacao?: string;
}

/**
 * Pausas na coleta densa (QA José): pausar só o que precisa de fluxo
 * (gol / pênalti / tiro livre multi-step). Demais eventos não travam o pad.
 */
const RULES: Record<string, MatchClockEventRule> = {
  pass: {
    pauseBeforeFlow: 'none',
    pauseAfterRegister: 'none',
    exigeConfirmacao: false,
    validada: true,
  },
  'shot:inside': {
    pauseBeforeFlow: 'none',
    pauseAfterRegister: 'none',
    exigeConfirmacao: false,
    validada: true,
  },
  'shot:outside': {
    pauseBeforeFlow: 'none',
    pauseAfterRegister: 'none',
    exigeConfirmacao: false,
    validada: true,
  },
  'shot:post': {
    pauseBeforeFlow: 'none',
    pauseAfterRegister: 'none',
    exigeConfirmacao: false,
    validada: true,
  },
  'shot:blocked': {
    pauseBeforeFlow: 'none',
    pauseAfterRegister: 'none',
    exigeConfirmacao: false,
    validada: true,
  },
  foul: {
    pauseBeforeFlow: 'none',
    pauseAfterRegister: 'none',
    exigeConfirmacao: true,
    validada: true,
  },
  goal: {
    pauseBeforeFlow: 'manual',
    pauseAfterRegister: 'event',
    exigeConfirmacao: true,
    validada: true,
  },
  card: {
    pauseBeforeFlow: 'none',
    pauseAfterRegister: 'none',
    exigeConfirmacao: true,
    validada: true,
  },
  tackle: {
    pauseBeforeFlow: 'none',
    pauseAfterRegister: 'none',
    exigeConfirmacao: false,
    validada: true,
  },
  save: {
    pauseBeforeFlow: 'none',
    pauseAfterRegister: 'none',
    exigeConfirmacao: false,
    validada: true,
  },
  block: {
    pauseBeforeFlow: 'none',
    pauseAfterRegister: 'none',
    exigeConfirmacao: false,
    validada: true,
  },
  corner: {
    pauseBeforeFlow: 'none',
    pauseAfterRegister: 'none',
    exigeConfirmacao: false,
    validada: true,
  },
  freeKick: {
    pauseBeforeFlow: 'manual',
    pauseAfterRegister: 'none',
    exigeConfirmacao: true,
    validada: true,
    observacao: 'Pausa só durante o fluxo multi-step; relógio não fica travado após gravar.',
  },
  penalty: {
    pauseBeforeFlow: 'manual',
    pauseAfterRegister: 'event',
    exigeConfirmacao: true,
    validada: true,
  },
  lateral: {
    pauseBeforeFlow: 'none',
    pauseAfterRegister: 'none',
    exigeConfirmacao: false,
    validada: true,
  },
};

function buildShotRuleKey(result?: string): string {
  switch (result) {
    case 'outside':
      return 'shot:outside';
    case 'post':
      return 'shot:post';
    case 'blocked':
      return 'shot:blocked';
    default:
      return 'shot:inside';
  }
}

export function getMatchClockEventRule(
  type: MatchClockEventType,
  result?: string
): MatchClockEventRule {
  if (type === 'shot') {
    return RULES[buildShotRuleKey(result)];
  }

  return RULES[type];
}
