import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ShellStatusPanelProps {
  hasUnsavedChanges: boolean;
  mode: 'realtime' | 'postmatch';
  collectionStatusMessage: string;
  alertMessage?: string | null;
}

export const ShellStatusPanel: React.FC<ShellStatusPanelProps> = ({
  hasUnsavedChanges,
  mode,
  collectionStatusMessage,
  alertMessage,
}) => {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Contexto operacional</p>
        <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-300">
          {mode === 'postmatch' ? 'manual' : 'clockservice'}
        </span>
      </div>

      <div className="mt-3 space-y-3">
        <div
          data-testid="shell-context-status"
          className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3"
        >
          <p className="text-[11px] font-bold uppercase text-zinc-500">Estado</p>
          <p className="mt-1 text-sm font-semibold text-white">{collectionStatusMessage}</p>
        </div>

        <div
          data-testid="shell-context-alert"
          className={`rounded-2xl border p-3 ${
            alertMessage
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
          }`}
        >
          <div className="flex items-start gap-2">
            {alertMessage ? (
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            )}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em]">
                {alertMessage ? 'Alerta prioritario' : 'Sem alertas no momento'}
              </p>
              <p className="mt-1 text-sm">{alertMessage ?? 'O shell esta pronto para a proxima acao oficial.'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
          <p className="text-[11px] font-bold uppercase text-zinc-500">Persistencia</p>
          <p data-testid="shell-unsaved-state" className="mt-1 text-sm font-semibold text-white">
            {hasUnsavedChanges ? 'Alteracoes pendentes' : 'Sem alteracoes pendentes'}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
          <p className="text-[11px] font-bold uppercase text-zinc-500">Modo</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {mode === 'postmatch' ? 'Pos-jogo manual' : 'Realtime com ClockService'}
          </p>
        </div>
        </div>
      </div>
    </section>
  );
};
