import React from 'react';
import { ArrowLeft, CheckCircle2, Clock3, Target, UserRound, XCircle } from 'lucide-react';
import {
  FinalizationResult,
  ShellEligiblePlayer,
  ShellManualTime,
  ShellStep,
} from './types';

const RESULT_OPTIONS: Array<{ value: FinalizationResult; label: string; helper: string }> = [
  { value: 'inside', label: 'No gol', helper: 'Finalizacao no alvo' },
  { value: 'outside', label: 'Para fora', helper: 'Finalizacao para fora' },
  { value: 'blocked', label: 'Bloqueada', helper: 'Finalizacao bloqueada' },
];

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

interface ShellFinalizationFlowProps {
  mode: 'realtime' | 'postmatch';
  step: ShellStep;
  nextStepMessage: string;
  currentPeriod: '1T' | '2T';
  eligiblePlayers: ShellEligiblePlayer[];
  selectedPlayer: ShellEligiblePlayer | null;
  selectedResultLabel: string | null;
  finalizationEnabled: boolean;
  manualTime?: ShellManualTime;
  onStartFlow: () => void;
  onPlayerSelect: (playerId: string) => void;
  onResultSelect: (result: FinalizationResult) => void;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  confirmDisabled: boolean;
}

export const ShellFinalizationFlow: React.FC<ShellFinalizationFlowProps> = ({
  mode,
  step,
  nextStepMessage,
  currentPeriod,
  eligiblePlayers,
  selectedPlayer,
  selectedResultLabel,
  finalizationEnabled,
  manualTime,
  onStartFlow,
  onPlayerSelect,
  onResultSelect,
  onBack,
  onCancel,
  onConfirm,
  confirmDisabled,
}) => {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Fluxo atual</p>
          <p data-testid="shell-next-step" className="mt-1 text-sm font-semibold text-zinc-100">
            {nextStepMessage}
          </p>
        </div>
        <div
          data-testid="shell-step"
          className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-300"
        >
          {step}
        </div>
      </div>

      {step === 'IDLE' && (
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-700 bg-black/30 p-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-zinc-100">Finalizacao pronta para iniciar.</p>
              <p className="mt-1 max-w-2xl text-sm text-zinc-400">
                O shell muda apenas a jornada de coleta. Evento, timestamp, periodo, save e reabertura continuam no pipeline oficial.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1">Evento oficial</span>
                <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1">Sem API propria</span>
                <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1">Sem save paralelo</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onStartFlow}
              disabled={!finalizationEnabled}
              data-testid="shell-finalization-start"
              className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-6 py-3 text-sm font-black uppercase transition-colors ${
                finalizationEnabled
                  ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'
                  : 'cursor-not-allowed border-zinc-800 bg-zinc-950 text-zinc-600'
              }`}
            >
              <Target size={18} />
              Finalizacao
            </button>
          </div>
        </div>
      )}

      {step !== 'IDLE' && step !== 'SUCCESS' && (
        <div className="mt-4 space-y-4">
          {step === 'SELECTING_ATHLETE' && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {eligiblePlayers.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => onPlayerSelect(player.id)}
                  data-testid={`shell-player-${player.id}`}
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-left transition-colors hover:border-cyan-500/50 hover:bg-cyan-500/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-zinc-500">Atleta</p>
                      <p className="mt-1 text-sm font-semibold text-white">{player.name}</p>
                    </div>
                    <span className="rounded-full border border-zinc-700 bg-black/40 px-2.5 py-1 text-[11px] font-bold text-zinc-300">
                      #{player.jerseyNumber ?? '?'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 'SELECTING_RESULT' && (
            <div className="grid gap-3 md:grid-cols-3">
              {RESULT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onResultSelect(option.value)}
                  data-testid={`shell-shot-result-${option.value}`}
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-left transition-colors hover:border-cyan-500/50 hover:bg-cyan-500/10"
                >
                  <p className="text-sm font-black uppercase text-white">{option.label}</p>
                  <p className="mt-1 text-xs text-zinc-400">{option.helper}</p>
                </button>
              ))}
            </div>
          )}

          {step === 'READY_TO_CONFIRM' && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Atleta</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-2 text-zinc-300">
                      <UserRound size={18} />
                    </div>
                    <div>
                      <p data-testid="shell-selected-player" className="text-sm font-semibold text-white">
                        {selectedPlayer?.name ?? 'Nao selecionado'}
                      </p>
                      <p className="text-xs text-zinc-400">#{selectedPlayer?.jerseyNumber ?? '?'}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Resultado</p>
                  <p data-testid="shell-selected-result" className="mt-2 text-sm font-semibold text-white">
                    {selectedResultLabel ?? 'Nao selecionado'}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">Periodo: {currentPeriod}</p>
                </div>
              </div>

              {mode === 'postmatch' && manualTime && (
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                  <div className="flex items-center gap-2 text-zinc-200">
                    <Clock3 size={16} />
                    <p className="text-sm font-bold uppercase">Horario manual</p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="text-xs font-bold uppercase text-zinc-500">
                      Minuto
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={manualTime.minute}
                        onChange={(event) =>
                          manualTime.onMinuteChange(clampInteger(Number(event.target.value), 0, 59))
                        }
                        data-testid="shell-time-minute"
                        className="mt-1 block w-24 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                      />
                    </label>
                    <label className="text-xs font-bold uppercase text-zinc-500">
                      Segundo
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={manualTime.second}
                        onChange={(event) =>
                          manualTime.onSecondChange(clampInteger(Number(event.target.value), 0, 59))
                        }
                        data-testid="shell-time-second"
                        className="mt-1 block w-24 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Target size={14} />
              <span>Cancelamento nao cria evento.</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                data-testid="shell-back"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-bold uppercase text-zinc-200 transition-colors hover:bg-zinc-900"
              >
                <ArrowLeft size={14} />
                Voltar
              </button>
              <button
                type="button"
                onClick={onCancel}
                data-testid="shell-cancel"
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase text-red-100 transition-colors hover:bg-red-500/20"
              >
                <XCircle size={14} />
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={confirmDisabled}
                data-testid="shell-finalization-confirm"
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-black uppercase transition-colors ${
                  !confirmDisabled
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20'
                    : 'cursor-not-allowed border-zinc-800 bg-zinc-950 text-zinc-600'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'SUCCESS' && (
        <div
          data-testid="shell-success"
          className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-4 text-emerald-100"
        >
          <CheckCircle2 size={20} />
          <div>
            <p className="text-sm font-bold uppercase">Finalizacao registrada</p>
            <p className="text-xs text-emerald-200">O evento entrou no mesmo pipeline oficial da coleta.</p>
          </div>
        </div>
      )}
    </section>
  );
};
