import React from 'react';
import { ArrowRight, Check, Mail, Trash2, X } from 'lucide-react';
import { OnboardingSnapshot } from '../services/api';

/**
 * Checklist de ativação no painel.
 *
 * É um mapa opcional do primeiro acesso: o utilizador pode explorar a
 * plataforma livremente e voltar ao Guia de Uso quando precisar.
 */

interface OnboardingChecklistProps {
  onboarding: OnboardingSnapshot;
  onNavigate: (stepId: string) => void;
  onClearDemo?: () => void;
  isClearingDemo?: boolean;
  onResendVerification?: () => Promise<boolean>;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  onboarding,
  onNavigate,
  onClearDemo,
  isClearingDemo,
  onResendVerification,
}) => {
  const [dismissed, setDismissed] = React.useState(() =>
    localStorage.getItem('scout21-onboarding-checklist-dismissed') === 'true'
  );
  const [isResending, setIsResending] = React.useState(false);
  const [verificationSent, setVerificationSent] = React.useState(false);

  if (onboarding.isComplete || dismissed) return null;

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
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xl font-black font-mono text-[#00f0ff]">{progress}%</span>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('scout21-onboarding-checklist-dismissed', 'true');
              setDismissed(true);
            }}
            className="text-zinc-500 hover:text-zinc-200 transition-colors"
            aria-label="Explorar a plataforma sem o checklist"
            title="Explorar depois"
          >
            <X size={16} />
          </button>
        </div>
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

      {!onboarding.emailVerified && (
        <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-3">
          <div className="flex items-start gap-2.5">
            <Mail size={15} className="mt-0.5 shrink-0 text-amber-300" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-100">Confirme seu e-mail quando puder</p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-100/70">
                Você pode explorar a plataforma normalmente. A confirmação mantém o registo de dados liberado durante o teste.
              </p>
              {onResendVerification && (
                <button
                  type="button"
                  disabled={isResending || verificationSent}
                  onClick={async () => {
                    setIsResending(true);
                    const sent = await onResendVerification();
                    setVerificationSent(sent);
                    setIsResending(false);
                  }}
                  className="mt-2 text-[11px] font-semibold text-amber-200 underline underline-offset-2 disabled:no-underline disabled:opacity-60"
                >
                  {verificationSent ? 'Link reenviado' : isResending ? 'Enviando…' : 'Reenviar link'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
