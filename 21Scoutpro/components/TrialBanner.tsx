import React, { useState } from 'react';
import { AlertTriangle, Clock, Mail, X } from 'lucide-react';
import { SubscriptionSnapshot, authApi } from '../services/api';

/**
 * Barra de estado do teste gratuito.
 *
 * Dois avisos distintos, por ordem de urgência:
 *  1. e-mail não confirmado (bloqueia escrita ao fim do prazo de tolerância);
 *  2. dias restantes do teste.
 *
 * O tom é informativo, nunca alarmista — e sempre repete que não haverá cobrança,
 * porque essa é a ansiedade real de quem está a testar.
 */

interface TrialBannerProps {
  subscription: SubscriptionSnapshot;
  emailVerified: boolean;
  onRefresh?: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ subscription, emailVerified, onRefresh }) => {
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setResending(true);
    const ok = await authApi.resendVerification();
    setResent(ok);
    setResending(false);
    if (ok) onRefresh?.();
  };

  // Aviso de e-mail tem prioridade: é o que bloqueia a conta primeiro.
  if (!emailVerified) {
    return (
      <div className="w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center">
          <Mail size={15} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-100">
            {resent
              ? 'Link reenviado. Confira sua caixa de entrada e o spam.'
              : 'Confirme seu e-mail para manter o registo de dados liberado.'}
          </p>
          {!resent && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-xs font-semibold text-amber-300 hover:text-amber-200 underline
                         disabled:opacity-60 disabled:no-underline"
            >
              {resending ? 'Enviando...' : 'Reenviar link'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (subscription.isExpired) {
    return (
      <div className="w-full bg-red-500/10 border-b border-red-500/30 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center">
          <AlertTriangle size={15} className="text-red-400 shrink-0" />
          <p className="text-xs text-red-100">
            Seu teste terminou. Você continua a poder <strong>consultar e exportar</strong> tudo o que registou.
          </p>
          <a
            href="mailto:scout21@intersomos.com.br?subject=Continuar%20com%20o%20SCOUT21"
            className="text-xs font-semibold text-red-200 hover:text-red-100 underline"
          >
            Falar sobre continuar
          </a>
        </div>
      </div>
    );
  }

  if (!subscription.isTrialing || dismissed) return null;

  const days = subscription.trialDaysRemaining ?? 0;
  // Só fica insistente na última semana; antes disso é informação, não pressão.
  const isUrgent = days <= 7;

  return (
    <div
      className={`w-full border-b px-4 py-2 ${
        isUrgent ? 'bg-amber-500/10 border-amber-500/30' : 'bg-zinc-900/60 border-zinc-800'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 relative">
        <Clock size={14} className={isUrgent ? 'text-amber-400' : 'text-[#00f0ff]'} />
        <p className={`text-xs ${isUrgent ? 'text-amber-100' : 'text-zinc-300'}`}>
          {days === 0
            ? 'Último dia do seu teste gratuito.'
            : `Faltam ${days} dia${days === 1 ? '' : 's'} do seu teste gratuito.`}
          <span className="text-zinc-500 ml-1.5 hidden sm:inline">Nada será cobrado.</span>
        </p>

        {!isUrgent && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="absolute right-0 text-zinc-600 hover:text-zinc-400 transition-colors"
            aria-label="Ocultar aviso"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
