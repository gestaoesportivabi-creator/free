import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react';
import {
  getUsageGuideSection,
  USAGE_GUIDE_SECTIONS,
  UsageGuideTopicId,
} from '../../content/usageGuideContent';
import { GuideTopicContent } from './GuideTopicContent';

interface UsageGuidePageProps {
  onBackToDashboard: () => void;
}

export const UsageGuidePage: React.FC<UsageGuidePageProps> = ({
  onBackToDashboard,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<UsageGuideTopicId>('comece-por-aqui');

  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as UsageGuideTopicId;
    if (USAGE_GUIDE_SECTIONS.some((section) => section.id === hash)) {
      setSelectedTopic(hash);
    }
  }, []);

  useEffect(() => {
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${window.location.search}#${selectedTopic}`
    );
  }, [selectedTopic]);

  const currentSection = getUsageGuideSection(selectedTopic);

  return (
    <div
      data-testid="usage-guide-page"
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 animate-fade-in pb-12"
    >
      <header className="rounded-3xl border border-zinc-800 bg-black p-6 shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00f0ff]">
              Central de Ajuda
            </p>
            <h1 className="mt-2 text-2xl font-black uppercase tracking-wide text-white">
              Guia de Uso Scout21
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
              Um guia rápido para abrir partidas, usar o cronômetro, registrar eventos,
              salvar como incompleta, retomar a coleta e finalizar o trabalho com
              segurança.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold uppercase tracking-wide text-zinc-100 transition-colors hover:bg-zinc-800"
          >
            <ArrowLeft size={16} />
            Voltar ao dashboard
          </button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-zinc-800 bg-black p-4 shadow-lg">
          <h2 className="px-2 text-xs font-bold uppercase tracking-[0.24em] text-zinc-500">
            Tópicos
          </h2>
          <nav className="mt-4 space-y-2" aria-label="Tópicos do guia de uso">
            {USAGE_GUIDE_SECTIONS.map((section) => {
              const isActive = selectedTopic === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  data-testid={`guide-nav-${section.id}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setSelectedTopic(section.id)}
                  className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${
                    isActive
                      ? 'border-[#00f0ff]/60 bg-[#00f0ff]/10 text-white'
                      : 'border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold uppercase tracking-wide">
                      {section.topic}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">
                      {section.summary}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={isActive ? 'text-[#00f0ff]' : 'text-zinc-500'}
                  />
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="space-y-6">
          <section className="rounded-3xl border border-zinc-800 bg-black p-4 shadow-lg sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#00f0ff]/40 bg-[#00f0ff]/10">
                <BookOpen className="text-[#00f0ff]" size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-wide text-white">
                  Como aproveitar melhor este guia
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Leia a ordem completa na primeira vez. Depois, use os tópicos como
                  consulta rápida durante a operação.
                </p>
              </div>
            </div>
          </section>

          <GuideTopicContent
            section={currentSection}
            onSelectTopic={setSelectedTopic}
          />
        </div>
      </div>
    </div>
  );
};
