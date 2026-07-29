import React from 'react';
import {
  CURRENT_COLLECTION_EXPERIENCE,
  SHELL_COLLECTION_EXPERIENCE,
  type CollectionExperience,
} from '../utils/collectionExperience';

interface CollectionExperienceSelectorProps {
  value: CollectionExperience;
  feedbackMessage?: string | null;
  onChange: (experience: CollectionExperience) => void;
}

const OPTIONS: Array<{
  value: CollectionExperience;
  title: string;
  description: string;
  badge?: string;
}> = [
  {
    value: CURRENT_COLLECTION_EXPERIENCE,
    title: 'Interface atual',
    description: 'Estavel e utilizada atualmente.',
  },
  {
    value: SHELL_COLLECTION_EXPERIENCE,
    title: 'Shell experimental',
    description: 'Nova jornada de coleta em avaliacao.',
    badge: 'Experimental',
  },
];

export const CollectionExperienceSelector: React.FC<
  CollectionExperienceSelectorProps
> = ({ value, feedbackMessage, onChange }) => {
  return (
    <section
      data-testid="collection-experience-selector"
      className="rounded-3xl border border-zinc-800 bg-black p-6 shadow-xl"
      aria-labelledby="collection-experience-title"
    >
      <div className="flex flex-col gap-2">
        <h3
          id="collection-experience-title"
          className="text-white font-bold uppercase text-sm tracking-widest"
        >
          Experiencia de coleta
        </h3>
        <p className="text-zinc-500 text-sm">
          Escolha qual interface sera usada na proxima abertura da coleta.
        </p>
      </div>

      <div
        className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2"
        role="radiogroup"
        aria-label="Experiencia de coleta"
      >
        {OPTIONS.map((option) => {
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-testid={`collection-experience-${option.value}`}
              onClick={() => onChange(option.value)}
              className={`rounded-2xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:ring-offset-2 focus:ring-offset-black ${
                isSelected
                  ? 'border-[#10b981] bg-[#10b981]/10 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]'
                  : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold uppercase tracking-wide">
                      {option.title}
                    </span>
                    {option.badge ? (
                      <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200">
                        {option.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">{option.description}</p>
                </div>

                <span
                  aria-hidden="true"
                  className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${
                    isSelected
                      ? 'border-[#10b981] bg-[#10b981] text-black'
                      : 'border-zinc-600 bg-transparent'
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isSelected ? 'bg-black' : 'bg-transparent'
                    }`}
                  />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div
        data-testid="collection-experience-feedback"
        aria-live="polite"
        className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
          feedbackMessage
            ? 'border-[#10b981]/40 bg-[#10b981]/10 text-[#a7f3d0]'
            : 'border-zinc-800 bg-zinc-950 text-zinc-500'
        }`}
      >
        {feedbackMessage ?? 'Sem preferencia especial definida alem da interface selecionada.'}
      </div>
    </section>
  );
};
