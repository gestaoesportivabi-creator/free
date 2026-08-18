import React from 'react';
import { SectionHeading } from '../shared/SectionHeading';
import { useInView } from '../useInView';
import { track } from '../../../utils/analytics';
import { JP7_PATH } from '../../../utils/jacksonPollock7';

type FeatureItem = string | { label: string; href: string };

const COLUMNS: { title: string; items: FeatureItem[] }[] = [
  {
    title: 'Elenco e rotina',
    items: [
      'Cadastro completo',
      'Programação semanal',
      'Convocações',
      'Departamento médico',
      'Portal do atleta',
    ],
  },
  {
    title: 'Jogo',
    items: [
      'Coleta ao vivo',
      'Coleta por súmula',
      'Scout coletivo',
      'Ranking',
      'Tabela de campeonato',
      'Relatório gerencial / PDF',
    ],
  },
  {
    title: 'Fisiologia',
    items: [
      'PSE treinos e jogos',
      'PSR treinos e jogos',
      'Qualidade de sono',
      'Bem-estar diário',
      { label: 'Avaliação física (7 dobras)', href: JP7_PATH },
      'Musculação + lesões',
    ],
  },
  {
    title: 'Inteligência',
    items: [
      'Assistente de IA',
      'Prontidão da equipe',
      'ACWR 7d / 28d',
      'Alertas interpretativos',
      'Briefing pré-jogo',
      'Scout adversário (YouTube)',
    ],
  },
];

export const FeatureGrid: React.FC = () => {
  const [ref, inView] = useInView();

  return (
    <section
      id="incluido"
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-20 md:py-28 px-4 md:px-8 transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          eyebrow="Amplitude"
          title="Tudo o que está incluído"
          subtitle="Um único lugar para a comissão técnica — sem planilha paralela."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-black uppercase tracking-wider text-[#00f0ff] mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.items.map((item) => {
                  if (typeof item === 'string') {
                    return (
                      <li key={item} className="landing-body text-sm text-zinc-400">
                        {item}
                      </li>
                    );
                  }
                  return (
                    <li key={item.href} className="landing-body text-sm">
                      <a
                        href={item.href}
                        onClick={() => track('cta_calculator_jp7_click', { where: 'feature-grid' })}
                        className="text-[#00f0ff] hover:underline"
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-12 text-center text-xs text-zinc-600 font-mono">
          20 áreas no menu · 117 endpoints · 34 modelos — um único lugar
        </p>
        <p className="mt-4 text-center text-sm text-zinc-500">
          <a
            href={JP7_PATH}
            onClick={() => track('cta_calculator_jp7_click', { where: 'feature-grid-footer' })}
            className="text-[#00f0ff] hover:underline"
          >
            Calculadora Jackson &amp; Pollock 7 dobras
          </a>
          {' — grátis, sem login'}
        </p>
      </div>
    </section>
  );
};
