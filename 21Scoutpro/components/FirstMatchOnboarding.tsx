import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Flag, Shield, Users, type LucideIcon } from 'lucide-react';

const DISMISSAL_KEY = 'scout21.firstMatchOnboarding.dismissed';

interface FirstMatchOnboardingProps {
  hasTeam: boolean;
  playerCount: number;
  matchCount: number;
  onOpenSettings: () => void;
  onOpenSquad: () => void;
  onCreateFirstMatch: () => void;
}

export const FirstMatchOnboarding: React.FC<FirstMatchOnboardingProps> = ({
  hasTeam,
  playerCount,
  matchCount,
  onOpenSettings,
  onOpenSquad,
  onCreateFirstMatch,
}) => {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSAL_KEY) === 'true');

  useEffect(() => {
    if (matchCount > 0) setDismissed(true);
  }, [matchCount]);

  if (dismissed || matchCount > 0) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSAL_KEY, 'true');
    setDismissed(true);
  };

  const nextAction = !hasTeam
    ? { label: 'Configurar minha equipe', onClick: onOpenSettings }
    : playerCount === 0
      ? { label: 'Cadastrar meu elenco', onClick: onOpenSquad }
      : { label: 'Criar meu primeiro jogo', onClick: onCreateFirstMatch };

  return (
    <section aria-labelledby="first-match-onboarding-title" data-testid="first-match-onboarding" className="rounded-2xl border border-[#00f0ff]/35 bg-gradient-to-br from-[#00f0ff]/12 via-zinc-950 to-zinc-950 p-5 sm:p-6 shadow-[0_0_30px_rgba(0,240,255,0.08)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#00f0ff]">Primeiros passos</p>
          <h2 id="first-match-onboarding-title" className="mt-2 text-xl font-black uppercase italic tracking-tight text-white sm:text-2xl">Prepare sua primeira partida</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-300">Complete o essencial uma vez. Depois, escolha entre coleta em tempo real ou preenchimento pós-jogo na tela da partida.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={nextAction.onClick} data-testid="first-match-onboarding-primary" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#00f0ff] px-4 py-3 text-sm font-black uppercase tracking-wide text-black transition-colors hover:bg-[#70f8ff] focus:outline-none focus:ring-2 focus:ring-[#00f0ff] focus:ring-offset-2 focus:ring-offset-black">
            {nextAction.label}<ArrowRight size={17} aria-hidden />
          </button>
          <button type="button" onClick={dismiss} data-testid="first-match-onboarding-dismiss" className="min-h-11 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#00f0ff] focus:ring-offset-2 focus:ring-offset-black">Explorar depois</button>
        </div>
      </div>
      <ol className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Etapas para a primeira partida">
        <OnboardingStep icon={Shield} label="Equipe" complete={hasTeam} detail="Defina o nome do time nas configurações." />
        <OnboardingStep icon={Users} label="Elenco" complete={playerCount > 0} detail={playerCount > 0 ? `${playerCount} atleta${playerCount === 1 ? '' : 's'} cadastrado${playerCount === 1 ? '' : 's'}.` : 'Cadastre ao menos um atleta para começar.'} />
        <OnboardingStep icon={Flag} label="Primeiro jogo" complete={false} detail="Abra Dados do Jogo e escolha o tipo de coleta." />
      </ol>
    </section>
  );
};

function OnboardingStep({ icon: Icon, label, detail, complete }: {
  icon: LucideIcon;
  label: string;
  detail: string;
  complete: boolean;
}) {
  return (
    <li className={`rounded-xl border p-4 ${complete ? 'border-emerald-400/35 bg-emerald-500/10' : 'border-zinc-700 bg-black/30'}`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${complete ? 'bg-emerald-400 text-black' : 'bg-zinc-800 text-[#00f0ff]'}`}>
          {complete ? <Check size={16} aria-hidden /> : <Icon size={16} aria-hidden />}
        </span>
        <span className="text-sm font-black uppercase tracking-wide text-white">{label}</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-zinc-400">{detail}</p>
    </li>
  );
}
