import { ShellEventSpec } from './types';

const athleteStep = (label: string) => ({
  id: 'athlete',
  kind: 'ATHLETE' as const,
  label,
});

const teamOptions = [
  { value: 'for', label: 'NOSSA', helper: 'Evento da nossa equipe', shortcut: '1' },
  { value: 'against', label: 'ADVERSÁRIO', helper: 'Evento da equipe adversária', shortcut: '2' },
];

const setPieceResultOptions = [
  { value: 'goal', label: 'GOL', helper: 'Cobrança convertida', shortcut: '1' },
  { value: 'saved', label: 'DEFENDIDO', helper: 'Defesa do goleiro', shortcut: '2' },
  { value: 'outside', label: 'PRA FORA', helper: 'Fora da meta', shortcut: '3' },
  { value: 'post', label: 'TRAVE', helper: 'Acertou a trave', shortcut: '4' },
  { value: 'noGoal', label: 'NÃO GOL', helper: 'Outro desfecho sem gol', shortcut: '5' },
];

const zoneOptions = [
  { value: 'ataqueEsquerda', label: 'ATAQUE · ESQUERDA', shortcut: '1' },
  { value: 'ataqueDireita', label: 'ATAQUE · DIREITA', shortcut: '2' },
  { value: 'defesaEsquerda', label: 'DEFESA · ESQUERDA', shortcut: '3' },
  { value: 'defesaDireita', label: 'DEFESA · DIREITA', shortcut: '4' },
];

const optionalZoneStep = {
  id: 'zone',
  kind: 'ZONE' as const,
  label: 'Deseja informar a zona?',
  optional: true,
  skipLabel: 'Sem zona',
  options: zoneOptions,
  skipWhen: (draft: { mode?: 'realtime' | 'postmatch' }) => draft.mode === 'realtime',
};

export const eventSpecs: ShellEventSpec[] = [
  {
    id: 'goal',
    label: 'Gol',
    shortcut: 'G',
    classe: 'A',
    tier: 'primary',
    modes: ['realtime', 'postmatch'],
    tone: 'goal',
    steps: [
      { id: 'team', kind: 'TEAM', label: 'Gol de qual equipe?', options: teamOptions },
      {
        ...athleteStep('Quem marcou o gol?'),
        skipWhen: (draft) => draft.team === 'against',
      },
      {
        id: 'method',
        kind: 'CHOICE',
        field: 'goalMethod',
        label: 'Qual a origem do gol?',
        options: [
          { value: 'Escanteio', label: 'ESCANTEIO', helper: 'Bola parada', shortcut: '1' },
          { value: 'Laterais', label: 'LATERAL', helper: 'Bola parada', shortcut: '2' },
          { value: 'Tiro Livre', label: 'TIRO LIVRE', helper: 'Bola parada', shortcut: '3' },
          { value: 'Pênalti', label: 'PÊNALTI', helper: 'Bola parada', shortcut: '4' },
          { value: 'Faltas', label: 'FALTA', helper: 'Bola parada', shortcut: '5' },
          { value: 'Ataque', label: 'ATAQUE', shortcut: '6' },
          { value: 'Contra Ataque', label: 'CONTRA-ATAQUE', shortcut: '7' },
          { value: 'MARCAÇÃO ALTA', label: 'MARCAÇÃO ALTA', shortcut: '8' },
        ],
      },
      optionalZoneStep,
      {
        id: 'assist',
        kind: 'SECONDARY_ATHLETE',
        label: 'Quem deu a assistência?',
        optional: true,
        skipLabel: 'Sem assistência',
        skipWhen: (draft) => draft.team === 'against',
      },
    ],
    presets: [
      { id: 'goal-corner', label: 'Gol de escanteio', patch: { team: 'for', goalMethod: 'Escanteio', choices: { team: 'for', method: 'Escanteio', assist: '__skip__' } } },
      { id: 'goal-free-kick', label: 'Gol de tiro livre', patch: { team: 'for', goalMethod: 'Tiro Livre', choices: { team: 'for', method: 'Tiro Livre', assist: '__skip__' } } },
      { id: 'goal-lateral', label: 'Gol de lateral', patch: { team: 'for', goalMethod: 'Laterais', choices: { team: 'for', method: 'Laterais', assist: '__skip__' } } },
      { id: 'goal-counter', label: 'Gol de contra-ataque', patch: { team: 'for', goalMethod: 'Contra Ataque', choices: { team: 'for', method: 'Contra Ataque', assist: '__skip__' } } },
      { id: 'own-goal', label: 'Gol contra', patch: { team: 'against', result: 'contra', goalMethod: 'Gol Contra', isOpponentGoal: true, choices: { team: 'against', method: 'Gol Contra' } } },
    ],
    toDomainInput: (draft) => ({
      action: 'goal',
      playerId: draft.playerId,
      secondaryPlayerId: draft.secondaryPlayerId,
      team: draft.team,
      result: draft.result ?? 'normal',
      goalMethod: draft.goalMethod,
      isOpponentGoal: draft.team === 'against' || draft.isOpponentGoal,
      zone: draft.zone,
    }),
  },
  {
    id: 'shot',
    label: 'Finalização',
    testId: 'shell-finalization-start',
    shortcut: 'F',
    classe: 'B',
    tier: 'primary',
    modes: ['realtime', 'postmatch'],
    tone: 'finalization',
    steps: [
      athleteStep('Quem finalizou?'),
      {
        id: 'result',
        kind: 'CHOICE',
        label: 'Qual o resultado?',
        options: [
          { value: 'inside', label: 'NO GOL', helper: 'Finalização no alvo', shortcut: '1' },
          { value: 'post', label: 'TRAVE', helper: 'Na trave, sem gol', shortcut: '2' },
          { value: 'outside', label: 'PRA FORA', helper: 'Fora da meta', shortcut: '3' },
          { value: 'blocked', label: 'BLOQUEADA', helper: 'Bloqueada antes da meta', shortcut: '4' },
        ],
      },
      optionalZoneStep,
    ],
    presets: [
      { id: 'shot-post', label: 'Finalização na trave', patch: { result: 'post', choices: { result: 'post' } } },
      { id: 'shot-blocked', label: 'Finalização bloqueada', patch: { result: 'blocked', choices: { result: 'blocked' } } },
    ],
    toDomainInput: (draft) => ({ action: 'shot', playerId: draft.playerId, result: draft.result, zone: draft.zone }),
  },
  {
    id: 'foul',
    label: 'Falta',
    shortcut: 'L',
    classe: 'A',
    tier: 'primary',
    modes: ['realtime', 'postmatch'],
    tone: 'infraction',
    steps: [
      { id: 'team', kind: 'TEAM', label: 'Falta de qual equipe?', options: teamOptions },
      {
        ...athleteStep('Quem cometeu a falta?'),
        skipWhen: (draft) => draft.team === 'against',
      },
      optionalZoneStep,
    ],
    presets: [
      { id: 'sixth-foul-us', label: '6ª falta nossa', patch: { team: 'for', choices: { team: 'for' } } },
      { id: 'sixth-foul-opponent', label: '6ª falta adversária', patch: { team: 'against', choices: { team: 'against' } } },
    ],
    toDomainInput: (draft) => ({ action: 'foul', playerId: draft.playerId, team: draft.team, zone: draft.zone }),
  },
  {
    id: 'tackle',
    label: 'Desarme',
    shortcut: 'D',
    classe: 'B',
    tier: 'primary',
    modes: ['realtime', 'postmatch'],
    tone: 'defensive',
    steps: [
      athleteStep('Quem realizou o desarme?'),
      {
        id: 'result',
        kind: 'CHOICE',
        label: 'Qual o tipo de desarme?',
        options: [
          { value: 'withBall', label: 'COM BOLA', helper: 'Recuperou a posse', shortcut: '1' },
          { value: 'withoutBall', label: 'SEM BOLA', helper: 'Interrompeu sem recuperar', shortcut: '2' },
          { value: 'counter', label: 'CONTRA-ATAQUE', helper: 'Gerou transição ofensiva', shortcut: '3' },
        ],
      },
      optionalZoneStep,
    ],
    toDomainInput: (draft) => ({ action: 'tackle', playerId: draft.playerId, result: draft.result, zone: draft.zone }),
  },
  {
    id: 'save',
    label: 'Defesa',
    shortcut: 'E',
    classe: 'B',
    tier: 'secondary',
    modes: ['realtime', 'postmatch'],
    tone: 'defensive',
    steps: [
      { ...athleteStep('Qual goleiro fez a defesa?'), athleteRole: 'goalkeeper' },
      {
        id: 'result',
        kind: 'CHOICE',
        label: 'Qual o tipo de defesa?',
        options: [
          { value: 'simple', label: 'SIMPLES', helper: 'Defesa controlada', shortcut: '1' },
          { value: 'hard', label: 'DIFÍCIL', helper: 'Defesa de alta dificuldade', shortcut: '2' },
          { value: 'outside', label: 'SAÍDA', helper: 'Intervenção fora da meta', shortcut: '3' },
        ],
      },
      optionalZoneStep,
    ],
    toDomainInput: (draft) => ({ action: 'save', playerId: draft.playerId, result: draft.result, zone: draft.zone }),
  },
  {
    id: 'block',
    label: 'Bloqueio',
    shortcut: 'B',
    classe: 'B',
    tier: 'secondary',
    modes: ['realtime', 'postmatch'],
    tone: 'defensive',
    steps: [athleteStep('Quem realizou o bloqueio?')],
    toDomainInput: (draft) => ({ action: 'block', playerId: draft.playerId }),
  },
  {
    id: 'corner',
    label: 'Escanteio',
    shortcut: 'C',
    classe: 'B',
    tier: 'secondary',
    modes: ['realtime', 'postmatch'],
    tone: 'setPiece',
    steps: [
      { id: 'team', kind: 'TEAM', label: 'Escanteio para qual equipe?', options: teamOptions },
      {
        ...athleteStep('Quem cobrou o escanteio?'),
        skipWhen: (draft) => draft.team === 'against',
      },
      optionalZoneStep,
    ],
    toDomainInput: (draft) => ({ action: 'corner', playerId: draft.playerId, team: draft.team, zone: draft.zone }),
  },
  {
    id: 'shot-zone',
    label: 'Zona de chute',
    shortcut: 'Z',
    classe: 'B',
    tier: 'overflow',
    modes: ['realtime', 'postmatch'],
    tone: 'finalization',
    steps: [athleteStep('Quem finalizou na zona de chute?')],
    toDomainInput: (draft) => ({ action: 'shot', playerId: draft.playerId, result: 'blocked' }),
  },
  {
    id: 'card',
    label: 'Cartão',
    shortcut: 'K',
    classe: 'A',
    tier: 'secondary',
    modes: ['realtime', 'postmatch'],
    tone: 'infraction',
    steps: [
      { id: 'team', kind: 'TEAM', label: 'Cartão para qual equipe?', options: teamOptions },
      {
        ...athleteStep('Quem recebeu o cartão?'),
        skipWhen: (draft) => draft.team === 'against',
      },
      {
        id: 'cardType',
        kind: 'CHOICE',
        field: 'cardType',
        label: 'Qual o tipo de cartão?',
        options: [
          { value: 'yellow', label: 'AMARELO', shortcut: '1' },
          { value: 'secondYellow', label: '2º AMARELO', shortcut: '2' },
        ],
      },
    ],
    presets: [
      { id: 'yellow-us', label: 'Amarelo nosso', patch: { team: 'for', cardType: 'yellow', choices: { team: 'for', cardType: 'yellow' } } },
      { id: 'yellow-opponent', label: 'Amarelo adversário', patch: { team: 'against', cardType: 'yellow', choices: { team: 'against', cardType: 'yellow' } } },
    ],
    toDomainInput: (draft) => ({
      action: 'card',
      playerId: draft.playerId,
      team: draft.team,
      cardType: draft.cardType,
    }),
  },
  {
    id: 'expulsion',
    label: 'Expulsão',
    shortcut: 'X',
    classe: 'A',
    tier: 'overflow',
    modes: ['realtime', 'postmatch'],
    tone: 'infraction',
    requiresExplicitConfirm: true,
    steps: [
      { id: 'team', kind: 'TEAM', label: 'Expulsão de qual equipe?', options: teamOptions },
      {
        ...athleteStep('Quem foi expulso?'),
        skipWhen: (draft) => draft.team === 'against',
      },
      {
        id: 'cardType',
        kind: 'CHOICE',
        field: 'cardType',
        label: 'Confirmar cartão vermelho',
        options: [{ value: 'red', label: 'VERMELHO', helper: 'Expulsão direta', shortcut: '1' }],
      },
    ],
    toDomainInput: (draft) => ({
      action: 'card',
      playerId: draft.playerId,
      team: draft.team,
      cardType: 'red',
    }),
  },
  {
    id: 'penalty',
    label: 'Pênalti',
    shortcut: 'P',
    classe: 'A',
    tier: 'secondary',
    modes: ['realtime', 'postmatch'],
    tone: 'setPiece',
    steps: [
      { id: 'team', kind: 'TEAM', label: 'Pênalti para qual equipe?', options: teamOptions },
      { id: 'result', kind: 'CHOICE', label: 'Qual o resultado?', options: setPieceResultOptions },
      {
        ...athleteStep('Quem cobrou o pênalti?'),
        skipWhen: (draft) => draft.team === 'against',
      },
    ],
    toDomainInput: (draft) => ({
      action: 'penalty',
      playerId: draft.playerId,
      team: draft.team,
      result: draft.result,
    }),
  },
  {
    id: 'freeKick',
    label: 'Tiro livre',
    shortcut: 'T',
    classe: 'A',
    tier: 'secondary',
    modes: ['realtime', 'postmatch'],
    tone: 'setPiece',
    steps: [
      { id: 'team', kind: 'TEAM', label: 'Tiro livre para qual equipe?', options: teamOptions },
      { id: 'result', kind: 'CHOICE', label: 'Qual o resultado?', options: setPieceResultOptions },
      {
        ...athleteStep('Quem cobrou o tiro livre?'),
        skipWhen: (draft) => draft.team === 'against',
      },
    ],
    toDomainInput: (draft) => ({
      action: 'freeKick',
      playerId: draft.playerId,
      team: draft.team,
      result: draft.result,
    }),
  },
  {
    id: 'pass',
    label: 'Passe',
    shortcut: 'Q',
    classe: 'D',
    tier: 'secondary',
    modes: ['postmatch'],
    tone: 'operational',
    steps: [
      athleteStep('Quem realizou o passe?'),
      {
        id: 'result',
        kind: 'CHOICE',
        label: 'Qual o resultado do passe?',
        options: [
          { value: 'correct', label: 'CERTO', shortcut: '1' },
          { value: 'wrong', label: 'ERRADO', shortcut: '2' },
        ],
      },
      {
        id: 'receiver',
        kind: 'SECONDARY_ATHLETE',
        label: 'Quem recebeu ou era o alvo?',
      },
      {
        id: 'transition',
        kind: 'CHOICE',
        field: 'wrongPassGeneratedTransition',
        label: 'O erro gerou transição?',
        skipWhen: (draft) => draft.result !== 'wrong',
        options: [
          { value: 'false', label: 'NÃO', shortcut: '1' },
          { value: 'true', label: 'SIM', shortcut: '2' },
        ],
      },
      optionalZoneStep,
    ],
    toDomainInput: (draft) => ({
      action: 'pass',
      playerId: draft.playerId,
      secondaryPlayerId: draft.secondaryPlayerId,
      result: draft.result,
      wrongPassGeneratedTransition: draft.wrongPassGeneratedTransition,
      zone: draft.zone,
    }),
  },
  {
    id: 'keyPass',
    label: 'Passe-chave',
    shortcut: 'H',
    classe: 'C',
    tier: 'secondary',
    modes: ['postmatch'],
    tone: 'operational',
    steps: [
      athleteStep('Quem realizou o passe-chave?'),
      { id: 'receiver', kind: 'SECONDARY_ATHLETE', label: 'Quem recebeu o passe-chave?' },
      optionalZoneStep,
    ],
    toDomainInput: (draft) => ({
      action: 'keyPass',
      playerId: draft.playerId,
      secondaryPlayerId: draft.secondaryPlayerId,
      zone: draft.zone,
    }),
  },
  {
    id: 'assist',
    label: 'Assistência',
    shortcut: 'A',
    classe: 'C',
    tier: 'secondary',
    modes: ['postmatch'],
    tone: 'goal',
    steps: [
      athleteStep('Quem deu a assistência?'),
      { id: 'receiver', kind: 'SECONDARY_ATHLETE', label: 'Quem concluiu a jogada?' },
      optionalZoneStep,
    ],
    toDomainInput: (draft) => ({
      action: 'assist',
      playerId: draft.playerId,
      secondaryPlayerId: draft.secondaryPlayerId,
      zone: draft.zone,
    }),
  },
  {
    id: 'lateral',
    label: 'Lateral detalhado',
    shortcut: 'Y',
    classe: 'C',
    tier: 'overflow',
    modes: ['postmatch'],
    tone: 'setPiece',
    steps: [
      athleteStep('Quem cobrou o lateral?'),
      { id: 'zone', kind: 'ZONE', label: 'Em qual zona?', options: zoneOptions },
    ],
    toDomainInput: (draft) => ({
      action: 'lateral',
      playerId: draft.playerId,
      zone: draft.zone,
    }),
  },
  {
    id: 'substitution',
    label: 'Substituição',
    shortcut: 'S',
    classe: 'A',
    tier: 'secondary',
    modes: ['realtime'],
    tone: 'operational',
    requiresExplicitConfirm: true,
    steps: [
      athleteStep('Quem sai?'),
      {
        id: 'incoming',
        kind: 'SECONDARY_ATHLETE',
        athleteRole: 'bench',
        label: 'Quem entra?',
      },
    ],
    toDomainInput: (draft) => ({
      action: 'substitution',
      playerId: draft.playerId,
      secondaryPlayerId: draft.secondaryPlayerId,
    }),
  },
];

export const getEventSpecsForMode = (mode: 'realtime' | 'postmatch'): ShellEventSpec[] =>
  eventSpecs
    .filter((spec) => spec.modes.includes(mode))
    .map((spec) => ({
      ...spec,
      toDomainInput: (draft) => ({
        ...spec.toDomainInput(draft),
        timeOverride: draft.timeOverride,
        periodOverride: draft.periodOverride,
      }),
    }));

// Extensão demonstrativa: um 8º evento exige somente outra entrada nesta lista;
// Stage, Deck e useShellFlow continuam genéricos e não recebem JSX específico.
