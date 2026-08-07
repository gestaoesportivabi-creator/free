import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SectionHeading } from '../shared/SectionHeading';
import { useInView } from '../useInView';

interface HowToStartProps {
  goToSignup: (where: string) => (e: React.MouseEvent) => void;
}

const STEPS = [
  { num: '1', title: 'Crie a conta', desc: 'Menos de 1 minuto. Sem cartão.' },
  { num: '2', title: 'Monte o elenco', desc: 'Cole de uma planilha ou use dados demo.' },
  { num: '3', title: 'Registre um jogo', desc: 'Ao vivo ou pela súmula.' },
] as const;

export const HowToStart: React.FC<HowToStartProps> = ({ goToSignup }) => {
  const [ref, inView] = useInView();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-20 md:py-24 px-4 md:px-8 transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="max-w-5xl mx-auto">
        <SectionHeading
          title="Como começar"
          subtitle="Em poucos minutos você já vê seus próprios indicadores."
        />
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {STEPS.map((step) => (
            <div key={step.num} className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#00f0ff] text-black font-black text-xl">
                {step.num}
              </div>
              <h3 className="landing-headline text-xl text-white">{step.title}</h3>
              <p className="landing-body text-zinc-400 text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <a
            href="/criar-conta"
            onClick={goToSignup('how-to-start')}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#00f0ff] hover:bg-[#00d4e6] text-black font-semibold text-sm rounded-lg"
          >
            Criar conta <ArrowRight size={18} />
          </a>
        </div>
        <div className="mt-12 max-w-3xl mx-auto">
          <img
            src="/scout21pro-how-it-works.jpg"
            alt="Fluxo de uso do SCOUT21"
            className="w-full h-auto border border-zinc-800 opacity-90"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
};
