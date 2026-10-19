import React, { useId } from 'react';
import { describeAccumulatedFouls } from '../utils/freeKickRule';

export const FREE_KICK_PENALTY_MESSAGE =
  'Conclua o pênalti em andamento antes de registrar um tiro livre.';

export type FreeKickBlockReason = 'realtime' | 'fouls' | 'penalty' | null;

export interface FreeKickAvailability {
  blocked: boolean;
  reason: FreeKickBlockReason;
  message?: string;
}

/**
 * A trava de relógio/sync ou de pênalti impede o clique e tem prioridade de texto.
 * A contagem de faltas não desabilita o botão: o tiro livre com barreira existe
 * antes da 6ª falta. O texto diz qual lado cobra sem barreira e quantas faltam.
 */
export function resolveFreeKickAvailability(input: {
  foulsFor: number;
  foulsAgainst: number;
  realtimeLocked: boolean;
  realtimeMessage: string;
  penaltyBlocked?: boolean;
}): FreeKickAvailability {
  const ruleMessage = describeAccumulatedFouls(input.foulsFor, input.foulsAgainst).message;
  const penaltyBlocked = Boolean(input.penaltyBlocked);

  if (input.realtimeLocked) {
    return { blocked: true, reason: 'realtime', message: input.realtimeMessage };
  }

  if (penaltyBlocked) {
    return { blocked: true, reason: 'penalty', message: FREE_KICK_PENALTY_MESSAGE };
  }

  return { blocked: false, reason: null, message: ruleMessage };
}

const TOOLTIP_CSS = `
.freekick-wrap { position: relative; display: block; width: 100%; }
.freekick-btn { min-height: 56px; width: 100%; }
.freekick-tip {
  display: none;
  position: absolute;
  left: 50%;
  bottom: calc(100% + 6px);
  transform: translateX(-50%);
  z-index: 40;
  width: max-content;
  max-width: 280px;
  padding: 6px 8px;
  border-radius: 6px;
  background: #18181b;
  color: #f4f4f5;
  border: 1px solid #3f3f46;
  font-size: 11px;
  line-height: 1.35;
  font-weight: 600;
  text-align: center;
  text-transform: none;
  letter-spacing: 0;
  pointer-events: none;
  white-space: normal;
}
.freekick-wrap:hover > .freekick-tip,
.freekick-wrap:focus-within > .freekick-tip {
  display: block;
}
`;

interface FreeKickEventButtonProps {
  foulsFor: number;
  foulsAgainst: number;
  realtimeLocked: boolean;
  realtimeMessage: string;
  penaltyBlocked?: boolean;
  active: boolean;
  onSelect: () => void;
}

/**
 * Botão sem o atributo disabled: o Chromium não exibe title em controle disabled.
 * aria-disabled + guarda de clique/tecla mantêm o bloqueio e o foco para o aviso.
 */
export function FreeKickEventButton({
  foulsFor,
  foulsAgainst,
  realtimeLocked,
  realtimeMessage,
  penaltyBlocked = false,
  active,
  onSelect,
}: FreeKickEventButtonProps) {
  const hintId = useId();
  const availability = resolveFreeKickAvailability({
    foulsFor,
    foulsAgainst,
    realtimeLocked,
    realtimeMessage,
    penaltyBlocked,
  });
  const message = availability.message;

  const blockActivation = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <span
      className="freekick-wrap relative block w-full"
      data-testid="event-selector-freekick-wrap"
      data-block-reason={availability.reason ?? 'none'}
      title={message}
    >
      <style>{TOOLTIP_CSS}</style>
      <button
        type="button"
        data-testid="event-selector-freekick"
        className={`freekick-btn min-h-[56px] w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors shadow-lg ${
          availability.blocked
            ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
            : active
              ? 'bg-red-500/40 border-red-500 text-white'
              : 'bg-zinc-900 border-red-500/30 text-red-500/70 hover:bg-red-500/20 hover:border-red-500 hover:text-red-400'
        }`}
        aria-disabled={availability.blocked}
        aria-describedby={message ? hintId : undefined}
        title={message}
        onClick={(event) => {
          if (availability.blocked) {
            blockActivation(event);
            return;
          }
          onSelect();
        }}
        onKeyDown={(event) => {
          if (!availability.blocked) return;
          if (event.key === 'Enter' || event.key === ' ') {
            blockActivation(event);
          }
        }}
      >
        TIRO LIVRE
      </button>
      {message ? (
        <span id={hintId} role="tooltip" data-testid="tiro-livre-rule-hint" className="freekick-tip">
          {message}
        </span>
      ) : null}
    </span>
  );
}
