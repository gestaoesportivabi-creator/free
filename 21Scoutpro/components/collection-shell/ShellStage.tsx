import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, X } from 'lucide-react';
import { ShellEligiblePlayer, ShellEventDraft, ShellEventSpec, ShellFlowStep } from './types';
import { ShellFlowStatus } from './useShellFlow';

interface ShellStageProps {
  status: ShellFlowStatus;
  displayStep: string;
  spec: ShellEventSpec | null;
  draft: ShellEventDraft | null;
  step: ShellFlowStep | null;
  stickyAthlete: ShellEligiblePlayer | null;
  lastEventText?: string;
  error?: string | null;
  eventTime: { seconds: number; period: '1T' | '2T' };
  onChoose: (value: string) => void;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onSetTime: (seconds: number, period: '1T' | '2T') => void;
}

export const ShellStage: React.FC<ShellStageProps> = ({
  status,
  displayStep,
  spec,
  draft,
  step,
  stickyAthlete,
  lastEventText,
  error,
  eventTime,
  onChoose,
  onBack,
  onCancel,
  onConfirm,
  onSetTime,
}) => {
  const [showTimeEditor, setShowTimeEditor] = useState(false);
  const [timeMinute, setTimeMinute] = useState(Math.floor(eventTime.seconds / 60));
  const [timeSecond, setTimeSecond] = useState(eventTime.seconds % 60);
  const [timePeriod, setTimePeriod] = useState<'1T' | '2T'>(eventTime.period);

  useEffect(() => {
    setShowTimeEditor(false);
    setTimeMinute(Math.floor(eventTime.seconds / 60));
    setTimeSecond(eventTime.seconds % 60);
    setTimePeriod(eventTime.period);
  }, [eventTime.period, spec?.id]);

  const toggleTimeEditor = () => {
    setShowTimeEditor((current) => {
      if (!current) {
        setTimeMinute(Math.floor(eventTime.seconds / 60));
        setTimeSecond(eventTime.seconds % 60);
        setTimePeriod(eventTime.period);
      }
      return !current;
    });
  };

  const actorEcho = stickyAthlete
    ? `${stickyAthlete.name} #${stickyAthlete.jerseyNumber ?? '?'}`
    : null;

  return (
    <main className="relative min-h-0 flex-1 overflow-y-auto bg-black p-4" aria-label="Fluxo do evento">
      <span data-testid="shell-step" className="absolute right-4 top-3 rounded-full border border-zinc-600 px-3 py-1 text-[10px] font-black uppercase text-zinc-300">
        {displayStep}
      </span>

      {status === 'IDLE' && (
        <div className="grid h-full place-items-center text-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-zinc-400">Último evento</p>
            <p className="mt-2 text-xl font-black text-white">{lastEventText ?? 'Aguardando o primeiro registro'}</p>
            <p className="mt-2 text-sm text-zinc-400">
              {actorEcho ? `Atleta ativo: ${actorEcho}` : 'Selecione um atleta na trilha para reduzir o fluxo.'}
            </p>
            <button
              type="button"
              onClick={toggleTimeEditor}
              data-testid="shell-time-edit"
              className="mx-auto mt-5 inline-flex min-h-14 items-center gap-2 rounded-xl border border-zinc-600 px-4 text-xs font-bold uppercase text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              <Clock3 size={15} /> Editar próximo timestamp
            </button>
            {showTimeEditor && (
              <div data-testid="shell-time-editor" className="mt-3 flex flex-wrap items-end justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-left">
                <label className="text-[10px] font-bold uppercase text-zinc-300">
                  Período
                  <select value={timePeriod} onChange={(event) => setTimePeriod(event.target.value as '1T' | '2T')} className="mt-1 block h-11 rounded-lg border border-zinc-600 bg-black px-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
                    <option value="1T">1T</option>
                    <option value="2T">2T</option>
                  </select>
                </label>
                <label className="text-[10px] font-bold uppercase text-zinc-300">
                  Minuto
                  <input data-testid="shell-time-minute" type="number" min={0} max={20} value={timeMinute} onChange={(event) => setTimeMinute(Math.max(0, Math.min(20, Number(event.target.value))))} className="mt-1 block h-11 w-20 rounded-lg border border-zinc-600 bg-black px-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" />
                </label>
                <label className="text-[10px] font-bold uppercase text-zinc-300">
                  Segundo
                  <input data-testid="shell-time-second" type="number" min={0} max={59} value={timeSecond} onChange={(event) => setTimeSecond(Math.max(0, Math.min(59, Number(event.target.value))))} className="mt-1 block h-11 w-20 rounded-lg border border-zinc-600 bg-black px-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" />
                </label>
                <button
                  type="button"
                  data-testid="shell-time-apply"
                  onClick={() => {
                    onSetTime(timeMinute * 60 + timeSecond, timePeriod);
                    setShowTimeEditor(false);
                  }}
                  className="min-h-11 rounded-lg border border-cyan-300 bg-cyan-500/15 px-4 text-xs font-black uppercase text-cyan-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {status === 'STEP' && step && (
        <section className="mx-auto flex h-full max-w-5xl flex-col justify-center">
          <p className="text-[11px] font-black uppercase tracking-[.18em] text-cyan-300">{spec?.label}</p>
          <h2 className="mt-2 text-2xl font-black uppercase text-white">
            {step.label}{actorEcho ? ` · ${actorEcho}` : ''}
          </h2>
          {step.options && (
            <div className={`mt-6 grid gap-3 ${step.options.length <= 4 ? 'grid-cols-2 xl:grid-cols-4' : 'grid-cols-2 xl:grid-cols-3'}`}>
              {step.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChoose(option.value)}
                  data-testid={`shell-${spec?.id}-${step.id}-${option.value}`}
                  data-shell-option="true"
                  aria-keyshortcuts={option.shortcut}
                  className="min-h-24 rounded-2xl border border-zinc-600 bg-zinc-950 p-4 text-left transition-colors motion-reduce:transition-none hover:border-cyan-300 hover:bg-cyan-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                >
                  <span className="text-base font-black uppercase text-white">{option.label}</span>
                  {option.helper && <span className="mt-1 block text-xs text-zinc-300">{option.helper}</span>}
                  {option.shortcut && <span className="mt-3 inline-block rounded border border-zinc-600 px-2 py-0.5 text-[10px] text-zinc-300">{option.shortcut}</span>}
                </button>
              ))}
            </div>
          )}
          {!step.options && (step.kind === 'ATHLETE' || step.kind === 'SECONDARY_ATHLETE') && (
            <div className="mt-5">
              <p className="rounded-xl border border-dashed border-cyan-400/40 bg-cyan-400/5 p-4 text-sm text-cyan-100">
                Selecione o atleta na trilha.
              </p>
            </div>
          )}
          {step.skipLabel && (
            <button
              type="button"
              onClick={() => onChoose('__skip__')}
              data-testid={`shell-step-skip-${step.id}`}
              className="mt-3 min-h-14 rounded-xl border border-zinc-600 px-4 text-xs font-bold uppercase text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              {step.skipLabel}
            </button>
          )}
          <div className="mt-4">
            <button
              type="button"
              onClick={toggleTimeEditor}
              data-testid="shell-time-edit"
              className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-zinc-600 px-4 text-xs font-bold uppercase text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              <Clock3 size={15} /> Editar timestamp
            </button>
            {showTimeEditor && (
              <div data-testid="shell-time-editor" className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <label className="text-[10px] font-bold uppercase text-zinc-300">
                  Período
                  <select value={timePeriod} onChange={(event) => setTimePeriod(event.target.value as '1T' | '2T')} className="mt-1 block h-11 rounded-lg border border-zinc-600 bg-black px-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
                    <option value="1T">1T</option>
                    <option value="2T">2T</option>
                  </select>
                </label>
                <label className="text-[10px] font-bold uppercase text-zinc-300">
                  Minuto
                  <input data-testid="shell-time-minute" type="number" min={0} max={20} value={timeMinute} onChange={(event) => setTimeMinute(Math.max(0, Math.min(20, Number(event.target.value))))} className="mt-1 block h-11 w-20 rounded-lg border border-zinc-600 bg-black px-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" />
                </label>
                <label className="text-[10px] font-bold uppercase text-zinc-300">
                  Segundo
                  <input data-testid="shell-time-second" type="number" min={0} max={59} value={timeSecond} onChange={(event) => setTimeSecond(Math.max(0, Math.min(59, Number(event.target.value))))} className="mt-1 block h-11 w-20 rounded-lg border border-zinc-600 bg-black px-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" />
                </label>
                <button
                  type="button"
                  data-testid="shell-time-apply"
                  onClick={() => {
                    onSetTime(timeMinute * 60 + timeSecond, timePeriod);
                    setShowTimeEditor(false);
                  }}
                  className="min-h-11 rounded-lg border border-cyan-300 bg-cyan-500/15 px-4 text-xs font-black uppercase text-cyan-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>
          <div className="mt-6 flex gap-2">
            <button type="button" onClick={onBack} data-testid="shell-back" className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-zinc-600 px-4 text-xs font-bold uppercase text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
              <ArrowLeft size={15} /> Voltar
            </button>
            <button type="button" onClick={onCancel} data-testid="shell-cancel" className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-red-400 px-4 text-xs font-bold uppercase text-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
              <X size={15} /> Cancelar
            </button>
          </div>
        </section>
      )}

      {status === 'READY_TO_CONFIRM' && (
        <section className="grid h-full place-items-center">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-700 bg-zinc-950 p-6 text-center">
            <p data-testid="shell-selected-player" className="text-lg font-black text-white">{actorEcho ?? 'Evento de equipe'}</p>
            <p data-testid="shell-selected-result" className="mt-2 text-sm uppercase text-zinc-300">{draft?.result ?? draft?.team ?? spec?.label}</p>
            <button type="button" onClick={onConfirm} data-testid="shell-finalization-confirm" className="mt-5 min-h-14 rounded-xl border border-emerald-300 bg-emerald-500/15 px-6 text-sm font-black uppercase text-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
              Confirmar
            </button>
          </div>
        </section>
      )}

      {status === 'CONFIRMING' && <div className="grid h-full place-items-center text-sm font-bold uppercase text-zinc-400">Registrando…</div>}

      {status === 'SUCCESS' && (
        <div data-testid="shell-success" className="grid h-full place-items-center">
          <div className="text-center text-emerald-200">
            <CheckCircle2 size={48} className="mx-auto motion-reduce:transform-none" />
            <p className="mt-3 text-lg font-black uppercase">{spec?.label} registrada</p>
          </div>
        </div>
      )}

      {(status === 'ERROR' || error) && <p role="alert" className="absolute bottom-4 left-4 right-4 rounded-xl border border-red-400 bg-red-500/15 p-3 text-sm text-red-50">{error}</p>}
    </main>
  );
};
