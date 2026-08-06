import React from 'react';
import { ArrowRight, Check, Trash2 } from 'lucide-react';
import { OnboardingSnapshot } from '../services/api';

/**
 * Checklist de ativação no painel.
 *
 * Não tem botão de fechar enquanto houver passo pendente — é o mapa do
 * utilizador no primeiro acesso, não propaganda. Some sozinho ao completar.
 */

interface OnboardingChecklistProps {
  onboarding: OnboardingSnapshot;
  onNavigate: (stepId: string) => void;
  onClearDemo?: () => void;
  isClearingDemo?: boolean;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  onboarding,
  onNavigate,
  onClearDemo,
  isClearingDemo,
}) => {
  if (onboarding.isComplete) return null;

  const progress = Math.round((onboarding.completed / onboarding.total) * 100);

  return (
    <section
      aria-labelledby="onboarding-title"
      className="rounded-2xl border border-[#00f0ff]/25 bg-gradient-to-br from-[#00f0ff]/[0.06] to-transparent p-5 mb-6"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 id="onboarding-title" className="text-sm font-black uppercase tracking-wide text-white">
            Comece por aqui
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {onboarding.completed} de {onboarding.total} concluídos
          </p>
        </div>
        <span className="text-xl font-black font-mono text-[#00f0ff] shrink-0">{progress}%</span>
      </div>

      <div className="h-1 rounded-full bg-zinc-800 overflow-hidden mb-4">
        <div
          className="h-full bg-[#00f0ff] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="space-y-1.5">
        {onboarding.steps.map((step) => (
          <li key={step.id}>
            {step.done ? (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={3} className="text-emerald-400" />
                </span>
                <span className="text-sm text-zinc-500 line-through">{step.label}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(step.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left
                           hover:bg-white/[0.04] transition-colors group"
              >
                <span className="w-5 h-5 rounded-full border border-zinc-600 shrink-0" />
                <span className="flex-1 text-sm text-zinc-200">{step.label}</span>
                <ArrowRight
                  size={14}
                  className="text-zinc-600 group-hover:text-[#00f0ff] group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </button>
            )}
          </li>
        ))}
      </ul>

      {onboarding.hasDemoData && onClearDemo && (
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3">
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Sua conta tem dados de demonstração. Remova-os quando começar a lançar dados reais.
          </p>
          <button
            type="button"
            onClick={onClearDemo}
            disabled={isClearingDemo}
            className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold
                       text-zinc-400 hover:text-red-300 disabled:opacity-50 transition-colors"
          >
            <Trash2 size={12} />
            {isClearingDemo ? 'Removendo...' : 'Remover'}
          </button>
        </div>
      )}
    </section>
  );
};
