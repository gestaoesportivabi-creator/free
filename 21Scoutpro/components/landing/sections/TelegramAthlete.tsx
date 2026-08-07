import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SectionHeading } from '../shared/SectionHeading';
import { useInView } from '../useInView';

interface TelegramAthleteProps {
  goToSignup: (where: string) => (e: React.MouseEvent) => void;
}

export const TelegramAthlete: React.FC<TelegramAthleteProps> = ({ goToSignup }) => {
  const [ref, inView] = useInView();

  return (
    <section
      id="telegram"
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-20 md:py-28 px-4 md:px-8 bg-zinc-900/40 border-y border-zinc-800 transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Adoção do atleta"
            title="O dado só serve se o atleta responder"
            subtitle="O SCOUT21 pergunta pelo Telegram — que todo mundo já tem. Sono, PSE, bem-estar: cerca de 30 segundos, sem instalar app, sem senha nova."
          />
          <ul className="space-y-3 mb-8">
            <li className="flex gap-3 text-sm text-zinc-300">
              <code className="text-[#00f0ff] font-mono shrink-0">/hoje</code>
              <span>Status do dia + o que falta responder</span>
            </li>
            <li className="flex gap-3 text-sm text-zinc-300">
              <code className="text-[#00f0ff] font-mono shrink-0">/preencher</code>
              <span>Registrar pendências de bem-estar e carga</span>
            </li>
          </ul>
          <p className="landing-body text-zinc-500 text-sm mb-8">
            O treinador recebe consolidado. O atleta nem precisa abrir o painel web.
          </p>
          <a
            href="/criar-conta"
            onClick={goToSignup('telegram')}
            className="inline-flex items-center gap-2 px-5 py-3 border border-[#00f0ff]/50 text-[#00f0ff] hover:bg-[#00f0ff]/10 text-sm font-semibold rounded-lg transition-all"
          >
            Começar teste <ArrowRight size={16} />
          </a>
        </div>

        <div className="border border-zinc-700 bg-black p-5 md:p-6 font-mono text-sm space-y-4 max-w-md mx-auto w-full">
          <p className="text-zinc-500 text-xs uppercase tracking-wider">Telegram · bot do atleta</p>
          <p className="text-[#00f0ff]">/hoje</p>
          <div className="text-zinc-300 leading-relaxed space-y-2 border-l border-zinc-700 pl-3">
            <p>Bom dia, Lucas.</p>
            <p>Pendências de hoje:</p>
            <p className="text-amber-200">· Bem-estar matinal</p>
            <p className="text-amber-200">· PSE do treino de ontem</p>
            <p className="text-zinc-500 mt-2">Responda com /preencher</p>
          </div>
        </div>
      </div>
    </section>
  );
};
