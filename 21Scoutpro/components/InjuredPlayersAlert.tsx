import React, { useMemo } from 'react';
import { Player } from '../types';
import { Ambulance } from 'lucide-react';

interface InjuredPlayersAlertProps {
  players: Player[];
}

/**
 * Atletas em recuperação = lesão sem data de Retorno Real/Alta (returnDateActual, endDate) salva.
 * Retorno Previsto (returnDate) não conta - só Retorno Real indica que o atleta voltou.
 */
export const InjuredPlayersAlert: React.FC<InjuredPlayersAlertProps> = ({ players }) => {
  const injuredList = useMemo(() => {
    return players.filter((player) => {
      if (!player.injuryHistory || player.injuryHistory.length === 0) return false;
      return player.injuryHistory.some((injury) => {
        const hasActualReturn = !!(injury.returnDateActual || injury.endDate);
        return !hasActualReturn; // Lesão sem Retorno Real/Alta = vigente = em recuperação
      });
    });
  }, [players]);

  if (injuredList.length === 0) return null;

  return (
    <div className="rounded-lg border border-white/[0.08] bg-zinc-900/60 border-l-[3px] border-l-red-500 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <Ambulance className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0" />
        <div className="min-w-0">
          <span className="text-white font-semibold text-sm block mb-0.5">
            {injuredList.length} desfalque{injuredList.length > 1 ? 's' : ''} por lesão
          </span>
          <span className="text-zinc-400 text-[11px] line-clamp-2 opacity-80">
            {injuredList.map((p) => p.nickname || p.name).join(' · ')}
          </span>
        </div>
      </div>
    </div>
  );
};
