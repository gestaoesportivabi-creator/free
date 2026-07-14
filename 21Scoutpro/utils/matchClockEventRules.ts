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
    pauseAfterRegister: 'event',
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
    pauseBeforeFlow: 'manual',
    pauseAfterRegister: 'event',
    exigeConfirmacao: true,
    validada: true,
    observacao: 'A pausa esta validada; a observacao pendente da matriz refere-se ao detalhamento funcional da falta.',
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
    pauseBeforeFlow: 'manual',
    pauseAfterRegister: 'preserve-current',
    exigeConfirmacao: false,
    validada: false,
    observacao: 'Pendente de validacao com a comissao tecnica.',
  },
  corner: {
    pauseBeforeFlow: 'manual',
    pauseAfterRegister: 'preserve-current',
    exigeConfirmacao: false,
    validada: false,
    observacao: 'Pendente de validacao com a comissao tecnica.',
  },
  freeKick: {
    pauseBeforeFlow: 'manual',
    pauseAfterRegister: 'preserve-current',
    exigeConfirmacao: true,
    validada: false,
    observacao: 'Pendente de validacao com a comissao tecnica.',
  },
  penalty: {
    pauseBeforeFlow: 'manual',
    pauseAfterRegister: 'preserve-current',
    exigeConfirmacao: true,
    validada: false,
    observacao: 'Pendente de validacao com a comissao tecnica.',
  },
  lateral: {
    pauseBeforeFlow: 'manual',
    pauseAfterRegister: 'preserve-current',
    exigeConfirmacao: false,
    validada: false,
    observacao: 'Pendente de validacao com a comissao tecnica.',
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
