import React from 'react';
import { Activity, Brain, RefreshCw, CheckCircle2, Circle } from 'lucide-react';

export interface AthleteTodayData {
  date: string;
  equipeId?: string | null;
  recentMatchId?: string | null;
  recentMatchOpponent?: string | null;
  tasks: {
    bemEstarDiario: { required: boolean; completed: boolean };
    pseTreino: { required: boolean; completed: boolean };
    psrTreino: { required: boolean; completed: boolean };
    pseJogo: { required: boolean; completed: boolean };
    psrJogo: { required: boolean; completed: boolean };
  };
}

interface AthleteHomeProps {
  profileName: string;
  equipeName?: string | null;
  today: AthleteTodayData | null;
  onNavigate: (tab: string) => void;
}

function TaskRow({
  label,
  done,
  required,
  onGo,
}: {
  label: string;
  done: boolean;
  required: boolean;
  onGo: () => void;
}) {
  if (!required) return null;
  return (
    <button
      type="button"
      onClick={onGo}
      className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-zinc-800 bg-zinc-950 hover:border-[#10b981]/50 transition-colors text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        {done ? (
          <CheckCircle2 className="text-[#10b981] shrink-0" size={22} />
        ) : (
          <Circle className="text-amber-400 shrink-0" size={22} />
        )}
        <span className="text-white font-medium text-sm truncate">{label}</span>
      </div>
      <span className="text-[10px] font-bold uppercase text-[#10b981] shrink-0">
        {done ? 'Preenchido' : 'Preencher'}
      </span>
    </button>
  );
}

export const AthleteHome: React.FC<AthleteHomeProps> = ({
  profileName,
  equipeName,
  today,
  onNavigate,
}) => {
  const displayName = profileName.split(' ')[0] || profileName;
  const dateLabel = today?.date
    ? new Date(today.date + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : '';

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-8">
      <header>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Olá,</p>
        <h1 className="text-2xl font-black text-white">{displayName}</h1>
        {equipeName && <p className="text-zinc-400 text-sm mt-1">{equipeName}</p>}
      </header>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <h2 className="text-white font-bold uppercase text-xs tracking-wider mb-1">Hoje</h2>
        <p className="text-zinc-500 text-sm capitalize mb-4">{dateLabel}</p>
        <div className="space-y-2">
          <TaskRow
            label="Bem-estar diário"
            done={!!today?.tasks.bemEstarDiario.completed}
            required={!!today?.tasks.bemEstarDiario.required}
            onGo={() => onNavigate('athlete-wellness')}
          />
          <TaskRow
            label="PSE do treino"
            done={!!today?.tasks.pseTreino.completed}
            required={!!today?.tasks.pseTreino.required}
            onGo={() => onNavigate('athlete-pse')}
          />
          <TaskRow
            label="PSR pós-treino"
            done={!!today?.tasks.psrTreino.completed}
            required={!!today?.tasks.psrTreino.required}
            onGo={() => onNavigate('athlete-psr')}
          />
          {today?.recentMatchOpponent && (
            <>
              <TaskRow
                label={`PSE — jogo vs ${today.recentMatchOpponent}`}
                done={!!today?.tasks.pseJogo.completed}
                required={!!today?.tasks.pseJogo.required}
                onGo={() => onNavigate('athlete-pse')}
              />
              <TaskRow
                label={`PSR — jogo vs ${today.recentMatchOpponent}`}
                done={!!today?.tasks.psrJogo.completed}
                required={!!today?.tasks.psrJogo.required}
                onGo={() => onNavigate('athlete-psr')}
              />
            </>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('athlete-pse')}
          className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950 hover:border-[#10b981]/40 flex flex-col items-center gap-2"
        >
          <Activity className="text-[#10b981]" size={28} />
          <span className="text-white text-xs font-bold uppercase">PSE</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('athlete-psr')}
          className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950 hover:border-[#10b981]/40 flex flex-col items-center gap-2"
        >
          <RefreshCw className="text-[#10b981]" size={28} />
          <span className="text-white text-xs font-bold uppercase">PSR</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('athlete-wellness')}
          className="col-span-2 p-4 rounded-2xl border border-zinc-800 bg-zinc-950 hover:border-[#10b981]/40 flex flex-col items-center gap-2"
        >
          <Brain className="text-[#10b981]" size={28} />
          <span className="text-white text-xs font-bold uppercase">Bem-estar diário</span>
        </button>
      </section>
    </div>
  );
};
