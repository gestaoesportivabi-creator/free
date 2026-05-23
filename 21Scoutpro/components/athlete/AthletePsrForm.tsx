import React from 'react';
import { AthleteNumericForm } from './AthleteNumericForm';
import type { AthleteTodayData } from './AthleteHome';

interface AthletePsrFormProps {
  today: AthleteTodayData | null;
  equipeId?: string | null;
  onSaved?: () => void;
}

export const AthletePsrForm: React.FC<AthletePsrFormProps> = ({ today, equipeId, onSaved }) => {
  const types = [
    { type: 'psr-treino' as const, label: 'PSR — Recuperação pós-treino' },
    ...(today?.recentMatchId
      ? [
          {
            type: 'psr-jogo' as const,
            label: `PSR — Jogo vs ${today.recentMatchOpponent || 'adversário'}`,
            contextKey: 'jogoId' as const,
            contextId: today.recentMatchId,
          },
        ]
      : []),
  ];

  return (
    <AthleteNumericForm
      title="PSR"
      subtitle="Recuperação percebida (0 = muito ruim, 10 = totalmente recuperado)"
      types={types}
      equipeId={equipeId}
      defaultDate={today?.date}
      onSaved={onSaved}
    />
  );
};
