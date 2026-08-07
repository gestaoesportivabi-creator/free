import React from 'react';
import { SectionHeading } from '../shared/SectionHeading';
import { useInView } from '../useInView';

const POINTS = [
  {
    title: 'A planilha',
    desc: 'Dados espalhados em arquivos que ninguém abre depois do treino.',
  },
  {
    title: 'A memória',
    desc: '"Ele reclamou do joelho semana passada… acho." Sem histórico confiável.',
  },
  {
    title: 'O tempo',
    desc: 'Ninguém tem três horas livres para montar o relatório que a comissão precisa.',
  },
] as const;

export const PainPoints: React.FC = () => {
  const [ref, inView] = useInView();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-20 md:py-28 px-4 md:px-8 border-y border-zinc-800/80 transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="max-w-5xl mx-auto">
        <SectionHeading
          eyebrow="O problema"
          title="Hoje a decisão é no escuro"
          subtitle="Não falta empenho na comissão técnica. Falta sistema."
        />
        <div className="grid md:grid-cols-3 gap-8 md:gap-10">
          {POINTS.map((item) => (
            <div key={item.title} className="space-y-3">
              <h3 className="text-lg font-black uppercase tracking-wide text-white">{item.title}</h3>
              <p className="landing-body text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
