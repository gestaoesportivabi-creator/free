import React from 'react';
import { Lock } from 'lucide-react';

const WHATSAPP_URL =
  'https://wa.me/5548991486176?text=Olá%2C%20gostaria%20de%20informações%20sobre%20planos%20e%20recursos%20do%20SCOUT21.';

export const PLAN_LOCKED_TITLE = 'Esta área ainda não está disponível no seu plano';
export const PLAN_LOCKED_MESSAGE =
  'Este recurso faz parte de planos superiores. Entre em contato para conhecer opções de upgrade no seu acesso.';

export const EMPTY_STATE_TITLE = 'Sem dados ainda';
export const EMPTY_STATE_MESSAGE =
  'Cadastre elenco e jogos ou preencha as abas de Fisiologia para ver informações nesta área.';

interface EmBreveProps {
  /** `plan` = recurso bloqueado por plano; `empty` = área liberada mas sem dados */
  variant?: 'plan' | 'empty';
  title?: string;
  message?: string;
  featureName?: string;
  showDashboardLink?: boolean;
  onGoDashboard?: () => void;
}

export const LockedFeatureBlock: React.FC<{
  compact?: boolean;
  featureName?: string;
}> = ({ compact = false, featureName }) => (
  <div
    className={`flex flex-col items-center justify-center text-center ${
      compact ? 'py-8 px-4 rounded-xl border border-zinc-800 bg-zinc-950/50' : 'py-12 px-6 rounded-2xl border border-zinc-800 bg-zinc-900/50'
    }`}
  >
    <Lock className={`text-zinc-500 mb-3 ${compact ? 'w-10 h-10' : 'w-12 h-12'}`} strokeWidth={1.5} />
    {featureName && (
      <h3 className={`font-semibold text-white uppercase tracking-wide mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>
        {featureName}
      </h3>
    )}
    <p className={`text-zinc-400 max-w-md ${compact ? 'text-sm' : 'text-sm'}`}>{PLAN_LOCKED_MESSAGE}</p>
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white text-xs font-medium rounded-lg transition-colors"
    >
      Entrar em contato
    </a>
  </div>
);

export const EmBreve: React.FC<EmBreveProps> = ({
  variant = 'plan',
  title,
  message,
  featureName,
  showDashboardLink = true,
  onGoDashboard,
}) => {
  const isPlan = variant === 'plan';
  const resolvedTitle =
    title ?? (isPlan ? (featureName ? `${featureName}` : PLAN_LOCKED_TITLE) : EMPTY_STATE_TITLE);
  const resolvedMessage = message ?? (isPlan ? PLAN_LOCKED_MESSAGE : EMPTY_STATE_MESSAGE);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mb-6">
        <Lock className="text-zinc-400" size={40} strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-semibold text-white mb-2 max-w-md">{resolvedTitle}</h2>
      <p className="text-zinc-400 text-sm max-w-md leading-relaxed">{resolvedMessage}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {showDashboardLink && onGoDashboard && (
          <button
            type="button"
            onClick={onGoDashboard}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00f0ff] text-black text-sm font-semibold rounded-xl transition-colors hover:bg-[#00d4e6]"
          >
            Ir para Visão Geral
          </button>
        )}
        {isPlan && (
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Entrar em contato
          </a>
        )}
      </div>
    </div>
  );
};
