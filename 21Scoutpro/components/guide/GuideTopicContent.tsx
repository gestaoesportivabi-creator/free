import React from 'react';
import {
  UsageGuideSection,
  UsageGuideTopicId,
} from '../../content/usageGuideContent';

interface GuideTopicContentProps {
  section: UsageGuideSection;
  compact?: boolean;
  onSelectTopic?: (topicId: UsageGuideTopicId) => void;
}

export const GuideTopicContent: React.FC<GuideTopicContentProps> = ({
  section,
  compact = false,
  onSelectTopic,
}) => {
  return (
    <article
      aria-labelledby={`guide-topic-title-${section.id}`}
      data-testid={`guide-topic-${section.id}`}
      className={`rounded-3xl border border-zinc-800 bg-zinc-950 shadow-sm ${
        compact ? 'p-4 sm:p-5' : 'p-5 sm:p-7'
      }`}
    >
      <header className="border-b border-zinc-800 pb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#00f0ff]">
          {section.topic}
        </p>
        <h2
          id={`guide-topic-title-${section.id}`}
          className={`mt-2 font-black uppercase tracking-wide text-white ${
            compact ? 'text-lg' : 'text-2xl'
          }`}
        >
          {section.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-300">{section.summary}</p>
      </header>

      <div
        className={`grid gap-3 pt-4 ${
          compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
        }`}
      >
        <section className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
            O que esta tarefa faz
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-200">{section.objective}</p>
        </section>
        <section className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
            Quando usar
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-200">{section.whenToUse}</p>
        </section>
      </div>

      <section className="pt-5">
        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white">
          Passo a passo
        </h3>
        <ol className="mt-4 space-y-3">
          {section.steps.map((step, index) => (
            <li
              key={step.id}
              className="rounded-2xl border border-zinc-800 bg-black/30 p-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#00f0ff]/50 bg-[#00f0ff]/10 text-sm font-black text-[#00f0ff]">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-white">
                    {step.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{step.body}</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {step.requiredState ? (
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                          Estado necessario
                        </p>
                        <p className="mt-1 text-sm font-semibold text-zinc-100">
                          {step.requiredState}
                        </p>
                      </div>
                    ) : null}
                    {step.actionLabel ? (
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                          Acao do usuario
                        </p>
                        <p className="mt-1 text-sm font-semibold text-zinc-100">
                          {step.actionLabel}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  {step.expectedResult ? (
                    <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                        Resultado esperado
                      </p>
                      <p className="mt-1 text-sm text-emerald-100">{step.expectedResult}</p>
                    </div>
                  ) : null}
                  {step.warning ? (
                    <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
                        Aviso
                      </p>
                      <p className="mt-1 text-sm text-amber-100">{step.warning}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {section.practicalTip ? (
        <section className="mt-5 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-sky-200">
            Dica pratica
          </h3>
          <p className="mt-2 text-sm leading-6 text-sky-50">{section.practicalTip}</p>
        </section>
      ) : null}

      {section.warning ? (
        <section className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
            Aviso importante
          </h3>
          <p className="mt-2 text-sm leading-6 text-amber-50">{section.warning}</p>
        </section>
      ) : null}

      {section.comparisons?.length ? (
        <section className="pt-5">
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white">
            Diferencas importantes
          </h3>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {section.comparisons.map((comparison) => (
              <div
                key={comparison.id}
                className="rounded-2xl border border-zinc-800 bg-black/30 p-4"
              >
                <h4 className="text-sm font-bold uppercase tracking-wide text-white">
                  {comparison.title}
                </h4>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
                  {comparison.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00f0ff]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {section.scenarios?.length ? (
        <section className="pt-5">
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white">
            Situacoes comuns
          </h3>
          <div className="mt-4 space-y-3">
            {section.scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="rounded-2xl border border-zinc-800 bg-black/30 p-4"
              >
                <h4 className="text-sm font-bold uppercase tracking-wide text-white">
                  {scenario.title}
                </h4>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{scenario.body}</p>
                <ol className="mt-3 space-y-2 text-sm leading-6 text-zinc-200">
                  {scenario.steps.map((step, index) => (
                    <li key={`${scenario.id}-${index}`} className="flex gap-3">
                      <span className="font-black text-[#00f0ff]">{index + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                {scenario.expectedResult ? (
                  <p className="mt-3 text-sm font-semibold text-emerald-200">
                    Resultado esperado: {scenario.expectedResult}
                  </p>
                ) : null}
                {scenario.warning ? (
                  <p className="mt-2 text-sm font-semibold text-amber-200">
                    Aviso: {scenario.warning}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {section.relatedProblem ? (
        <section className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">
            Problema comum relacionado
          </h3>
          <p className="mt-2 text-sm leading-6 text-red-50">{section.relatedProblem}</p>
        </section>
      ) : null}

      {!compact && section.nextTopicId && onSelectTopic ? (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            data-testid={`guide-next-${section.nextTopicId}`}
            onClick={() => onSelectTopic(section.nextTopicId!)}
            className="min-h-[44px] rounded-xl border border-[#00f0ff]/50 bg-[#00f0ff]/10 px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#00f0ff] transition-colors hover:bg-[#00f0ff]/20"
          >
            Proximo topico
          </button>
        </div>
      ) : null}
    </article>
  );
};
