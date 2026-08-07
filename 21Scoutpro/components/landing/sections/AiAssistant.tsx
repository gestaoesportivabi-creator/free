import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SectionHeading } from '../shared/SectionHeading';
import { useInView } from '../useInView';

interface AiAssistantProps {
  goToSignup: (where: string) => (e: React.MouseEvent) => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ goToSignup }) => {
  const [ref, inView] = useInView();

  return (
    <section
      id="assistente"
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-20 md:py-28 px-4 md:px-8 transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="max-w-4xl mx-auto">
        <SectionHeading
          eyebrow="Assistente"
          title="Pergunte. Ele conhece seu elenco."
          subtitle="No painel ou pelo Telegram. Sem exportar planilha, sem montar relatório."
        />

        <div className="border border-zinc-700 bg-zinc-950 p-5 md:p-8 space-y-6">
          <div className="flex justify-end">
            <div className="max-w-[90%] md:max-w-[75%] bg-zinc-800 text-white text-sm md:text-base px-4 py-3 rounded-2xl rounded-br-sm">
              Como está a carga do Rafael esta semana?
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[95%] md:max-w-[85%] border border-[#00f0ff]/25 bg-black text-zinc-300 text-sm md:text-base px-4 py-3 rounded-2xl rounded-bl-sm leading-relaxed">
              Rafael Souza teve PSE médio 7,2 nos últimos 3 treinos, acima da média dele (5,8). O sono
              caiu para 6h. Score de prontidão: 58. Sugiro carga reduzida nesta sessão.
            </div>
          </div>
          <p className="text-[10px] text-zinc-600 text-center">
            Exemplo ilustrativo com nomes fictícios — o assistente usa o contexto real do seu elenco.
          </p>
        </div>

        <div className="mt-10 text-center">
          <a
            href="/criar-conta"
            onClick={goToSignup('ai')}
            className="inline-flex items-center gap-2 text-[#00f0ff] hover:text-white text-sm font-semibold transition-colors"
          >
            Experimentar no teste grátis <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
};
