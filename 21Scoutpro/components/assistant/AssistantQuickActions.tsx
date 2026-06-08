import React from 'react';

interface AssistantQuickActionsProps {
  isAthlete: boolean;
  disabled: boolean;
  onSelect: (message: string) => void;
}

const STAFF_ACTIONS = [
  { label: 'Último jogo', message: 'Qual foi o último jogo da minha equipe? Resuma placar, desempenho e destaques.' },
  { label: 'Elenco', message: 'Mostre um resumo do elenco atual: titulares, reservas e situação física.' },
  { label: 'Adversário', message: 'Quem é o próximo adversário? Dê um panorama tático e estatístico.' },
  { label: 'Menu', message: 'Mostre o menu de opções disponíveis no assistente Scout21.' },
];

const ATHLETE_ACTIONS = [
  { label: 'Meu PSE', message: 'Como está meu PSE recente? Resuma os últimos registros.' },
  { label: 'Bem-estar', message: 'Resuma meu bem-estar e sono dos últimos dias.' },
  { label: 'Agenda', message: 'O que tenho na agenda esta semana?' },
  { label: 'Menu', message: 'Quais opções você pode me ajudar como atleta?' },
];

export const AssistantQuickActions: React.FC<AssistantQuickActionsProps> = ({
  isAthlete,
  disabled,
  onSelect,
}) => {
  const actions = isAthlete ? ATHLETE_ACTIONS : STAFF_ACTIONS;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-3 sm:px-4 scrollbar-none">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(action.message)}
          className="shrink-0 min-h-[44px] px-4 py-2 rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/5 text-sm text-[#00f0ff] hover:bg-[#00f0ff]/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#00f0ff]/50"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};
