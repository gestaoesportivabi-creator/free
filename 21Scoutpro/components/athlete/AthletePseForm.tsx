import React from 'react';
import { AthleteNumericForm } from './AthleteNumericForm';
import type { AthleteTodayData } from './AthleteHome';

interface AthletePseFormProps {
  today: AthleteTodayData | null;
  equipeId?: string | null;
  onSaved?: () => void;
}

export const AthletePseForm: React.FC<AthletePseFormProps> = ({ today, equipeId, onSaved }) => {
  const types = [
    { type: 'pse-treino' as const, label: 'PSE — Treino de hoje' },
    ...(today?.recentMatchId
      ? [
          {
            type: 'pse-jogo' as const,
            label: `PSE — Jogo vs ${today.recentMatchOpponent || 'adversário'}`,
            contextKey: 'jogoId' as const,
            contextId: today.recentMatchId,
          },
        ]
      : []),
  ];

  return (
    <AthleteNumericForm
      title="PSE"
      subtitle="Escala de esforço percebido (0 = repouso, 10 = máximo)"
      types={types}
      equipeId={equipeId}
      defaultDate={today?.date}
      onSaved={onSaved}
    />
  );
};
