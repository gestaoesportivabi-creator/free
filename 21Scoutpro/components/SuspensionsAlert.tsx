import React, { useMemo } from 'react';
import { ChampionshipMatch } from '../types';
import { Championship } from '../types';
import { Player } from '../types';
import { getChampionshipCards, getPlayerStatus } from '../utils/championshipCards';
import { UserX, UserCheck } from 'lucide-react';

interface SuspensionsAlertProps {
  nextMatch: ChampionshipMatch | null;
  championships: Championship[];
  players: Player[];
  /** Exibir notificação simulada quando não houver suspensos (para demonstrar o formato). */
  showSimulatedExample?: boolean;
}

type SuspendedItem = { player: Player; reason: string; reasonLabel: string };

export const SuspensionsAlert: React.FC<SuspensionsAlertProps> = ({
  nextMatch,
  championships,
  players,
  showSimulatedExample = true,
}) => {
  const { suspended, pendurados, competitionName } = useMemo(() => {
    const compName = nextMatch?.competition || null;
    if (!nextMatch?.competition || championships.length === 0) {
      return { suspended: [] as SuspendedItem[], pendurados: [] as { player: Player; yellows: number }[], competitionName: compName };
    }

    const championship = championships.find((c) => c.name === nextMatch.competition);
    if (!championship?.suspensionRules) {
      return { suspended: [] as SuspendedItem[], pendurados: [] as { player: Player; yellows: number }[], competitionName: compName };
    }

    const rules = championship.suspensionRules;
    const cards = getChampionshipCards(championship.id);
    const nAmarelos = rules.yellowCardsForSuspension;

    const suspendedList: SuspendedItem[] = [];
    const penduradosList: { player: Player; yellows: number }[] = [];

    players.forEach((player) => {
      const record = cards[player.id];
      if (!record) return;

      const status = getPlayerStatus(championship.id, player.id, rules);

      if (status.suspended) {
        if (record.redSuspensionGamesRemaining > 0) {
          suspendedList.push({ player, reason: `Vermelho direto (${record.redSuspensionGamesRemaining} jogo${record.redSuspensionGamesRemaining > 1 ? 's' : ''} restante${record.redSuspensionGamesRemaining > 1 ? 's' : ''})`, reasonLabel: 'Vermelho direto' });
        } else if (record.yellowSuspensionGamesRemaining > 0) {
          suspendedList.push({ player, reason: `${nAmarelos} amarelos (${record.yellowSuspensionGamesRemaining} jogo${record.yellowSuspensionGamesRemaining > 1 ? 's' : ''} restante${record.yellowSuspensionGamesRemaining > 1 ? 's' : ''})`, reasonLabel: `${nAmarelos} amarelos` });
        }
      } else if (status.pendurado) {
        penduradosList.push({ player, yellows: status.yellows });
      }
    });

    return { suspended: suspendedList, pendurados: penduradosList, competitionName: compName };
  }, [nextMatch, championships, players]);

  const showSimulated = showSimulatedExample && suspended.length === 0 && pendurados.length === 0 && nextMatch?.competition;

  return (
    <div className="space-y-2">
      {suspended.length > 0 && (
        <div className="rounded-lg border border-white/[0.08] bg-zinc-900/60 border-l-[3px] border-l-red-500 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <UserX className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0" />
            <div className="min-w-0">
              <span className="text-white font-semibold text-sm block mb-0.5">
                {suspended.length} suspenso{suspended.length > 1 ? 's' : ''} para o próximo jogo{competitionName ? ` · ${competitionName}` : ''}
              </span>
              <ul className="text-zinc-400 text-[11px] space-y-0.5 list-none opacity-80">
                {suspended.map(({ player, reasonLabel }) => (
                  <li key={player.id}>
                    <span className="font-medium text-zinc-400">{player.nickname || player.name}</span>
                    {' — '}
                    {reasonLabel}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      {pendurados.length > 0 && (
        <div className="rounded-lg border border-white/[0.08] bg-zinc-900/60 border-l-[3px] border-l-amber-500 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <UserCheck className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0" />
            <div className="min-w-0">
              <span className="text-white font-semibold text-sm block mb-0.5">
                {pendurados.length} pendurado{pendurados.length > 1 ? 's' : ''} (1 amarelo da suspensão){competitionName ? ` · ${competitionName}` : ''}
              </span>
              <span className="text-zinc-400 text-[11px] line-clamp-2 opacity-80">
                {pendurados.map(({ player, yellows }) => `${player.nickname || player.name} (${yellows} amarelo${yellows > 1 ? 's' : ''})`).join(' · ')}
              </span>
            </div>
          </div>
        </div>
      )}
      {showSimulated && (
        <div className="rounded-lg border border-white/[0.08] border-dashed bg-zinc-900/50 border-l-[3px] border-l-red-500/80 px-3 py-2.5">
          <div className="flex items-start gap-2 text-xs">
            <UserX className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0" />
            <div className="min-w-0">
              <span className="text-zinc-400 font-semibold block mb-0.5">
                Suspensos para o próximo jogo · {nextMatch!.competition}
              </span>
              <p className="text-zinc-500 text-[10px] italic">
                Exemplo (regras do campeonato e cartões nos jogos):
              </p>
              <ul className="text-zinc-500 text-[10px] space-y-0.5 list-none mt-0.5">
                <li><span className="text-zinc-400">João Silva</span> — 3 amarelos</li>
                <li><span className="text-zinc-400">Carlos Souza</span> — Vermelho direto</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
