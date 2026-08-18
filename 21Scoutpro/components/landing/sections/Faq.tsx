import React, { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { SectionHeading } from '../shared/SectionHeading';
import { useInView } from '../useInView';

interface FaqProps {
  goToSignup: (where: string) => (e: React.MouseEvent) => void;
}

const FAQS = [
  {
    q: 'Preciso de cartão para testar?',
    a: 'Não. Nem cartão, nem Pix. Nada é cobrado ao fim dos 30 dias.',
  },
  {
    q: 'Funciona para outras modalidades?',
    a: 'O sistema nasceu no futsal e é otimizado para ele. Handebol e basquete funcionam com adaptações.',
  },
  {
    q: 'Meus atletas precisam instalar algo?',
    a: 'Não. Respondem pelo Telegram, que já têm. Também há portal web do atleta, se preferirem.',
  },
  {
    q: 'E se eu não tiver preparador físico?',
    a: 'É exatamente para esse caso. O sistema faz a leitura de carga (ACWR e prontidão) que faltaria montar à mão.',
  },
  {
    q: 'Meus dados ficam comigo?',
    a: 'Sim. Exportáveis a qualquer momento, inclusive após o teste. Leitura continua liberada se o teste expirar.',
  },
  {
    q: 'Tem calculadora de % de gordura sem cadastro?',
    a: 'Sim. Jackson & Pollock 7 dobras + Siri, no mesmo motor da avaliação física do SCOUT21. Um atleta você calcula agora; o elenco, a tendência e o cruzamento com PSE/PSR ficam no teste grátis.',
  },
  {
    q: 'Coleto sozinho durante o jogo?',
    a: 'Sim. A coleta ao vivo foi desenhada para uma pessoa só, com poucos toques por evento.',
  },
  {
    q: 'E se a conexão oscilar na quadra?',
    a: 'O sistema faz autosave contínuo durante a sessão. Mantenha a aba aberta até confirmar o salvamento.',
  },
] as const;

export const Faq: React.FC<FaqProps> = ({ goToSignup }) => {
  const [ref, inView] = useInView();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-20 md:py-28 px-4 md:px-8 transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="max-w-3xl mx-auto">
        <SectionHeading title="Perguntas frequentes" />
        <div className="space-y-2">
          {FAQS.map((item, idx) => {
            const isOpen = open === idx;
            return (
              <div key={item.q} className="border border-zinc-800 bg-zinc-950">
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : idx)}
                >
                  <span className="landing-body-medium text-sm md:text-base text-white">{item.q}</span>
                  <ChevronDown
                    className={`shrink-0 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    size={18}
                  />
                </button>
                {isOpen ? (
                  <p className="px-5 pb-4 landing-body text-sm text-zinc-400 leading-relaxed">{item.a}</p>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <a
            href="/criar-conta"
            onClick={goToSignup('faq')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#00f0ff] hover:text-white"
          >
            Ainda com dúvida? Comece o teste e veja por dentro <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
};
