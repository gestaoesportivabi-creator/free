import React from 'react';
import { Users, Target, Shield } from 'lucide-react';
import { SectionHeading } from '../shared/SectionHeading';
import { useInView } from '../useInView';

const AUDIENCE = [
  { icon: Users, title: 'Clubes de Futsal', desc: 'Adulto e base que precisam decidir com carga e scout no mesmo lugar.' },
  { icon: Target, title: 'Times Universitários', desc: 'Projetos competitivos com comissão enxuta e pouco tempo.' },
  { icon: Shield, title: 'Comissões Técnicas', desc: 'Treinadores que querem prontidão, risco e jogo — sem planilha paralela.' },
] as const;

export const Audience: React.FC = () => {
  const [ref, inView] = useInView();

  return (
    <section
      id="para-quem-e"
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-16 md:py-20 px-4 md:px-8 bg-zinc-900/50 border-b border-zinc-800 transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeading title="Para quem é" />
        <div className="grid md:grid-cols-3 gap-10">
          {AUDIENCE.map((item) => (
            <div key={item.title} className="space-y-3">
              <item.icon className="text-[#00f0ff]" size={36} />
              <h3 className="text-lg font-black uppercase text-white">{item.title}</h3>
              <p className="landing-body text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
