import React from 'react';
import type { WebAssistantStatus } from '../../services/assistantChatApi';

interface AssistantWelcomeProps {
  status: WebAssistantStatus | null;
  loading: boolean;
}

export const AssistantWelcome: React.FC<AssistantWelcomeProps> = ({ status, loading }) => {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse px-1" aria-hidden="true">
        <div className="h-5 w-48 bg-zinc-800 rounded-lg" />
        <div className="h-4 w-full max-w-sm bg-zinc-800/80 rounded-lg" />
        <div className="h-4 w-3/4 max-w-xs bg-zinc-800/60 rounded-lg" />
      </div>
    );
  }

  const name = status?.userName?.split(' ')[0] ?? 'técnico';
  const isAthlete = status?.userType === 'athlete';

  return (
    <div className="px-1 py-2">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
        Olá, {name}!
      </h2>
      <p className="text-[15px] leading-relaxed text-zinc-400">
        {isAthlete
          ? 'Sou seu assistente pessoal. Posso ajudar com PSE, bem-estar, agenda e informações do seu elenco.'
          : 'Sou o Assistente Scout21. Consulte jogos, elenco, adversários e insights da sua equipe por chat.'}
      </p>
      {status?.equipeCount != null && status.equipeCount > 0 && !isAthlete && (
        <p className="text-xs text-zinc-500 mt-2">
          {status.equipeCount} equipe{status.equipeCount > 1 ? 's' : ''} vinculada{status.equipeCount > 1 ? 's' : ''} à sua conta.
        </p>
      )}
    </div>
  );
};
