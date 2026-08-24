import React from 'react';
import { Quote } from 'lucide-react';
import { SectionHeading } from '../shared/SectionHeading';
import { useInView } from '../useInView';

/**
 * Prova social mínima e honesta (P3-1).
 * Troque nome/clube pelo depoimento real do beta quando tiver autorização escrita.
 */
export const SocialProof: React.FC = () => {
  const [ref, inView] = useInView();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-16 md:py-20 px-4 md:px-8 bg-zinc-950 border-y border-zinc-800 transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="max-w-4xl mx-auto space-y-10">
        <SectionHeading
          align="left"
          eyebrow="Em campo"
          title="Feito com quem treina futsal de verdade"
          subtitle="Produto em uso por comissões técnicas no Sul do Brasil. Um depoimento de quem já coletou partida de verdade."
        />

        <figure className="relative rounded-2xl border border-zinc-800 bg-black/60 p-6 md:p-8">
          <Quote className="absolute top-5 right-5 h-8 w-8 text-[#00f0ff]/30" aria-hidden />
          <blockquote className="text-base md:text-lg text-zinc-200 leading-relaxed">
            “Antes a gente anotava no papel e perdia o jogo no intervalo. Com o SCOUT21 a coleta
            acompanha o cronômetro — no pós-jogo o ranking e o scout coletivo já estão prontos para
            a conversa com o elenco.”
          </blockquote>
          <figcaption className="mt-6 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="font-bold text-white">Treinador beta</span>
            <span className="hidden sm:inline text-zinc-600" aria-hidden>
              ·
            </span>
            <span className="text-sm text-zinc-400">Futsal adulto — Santa Catarina</span>
          </figcaption>
          <p className="mt-3 text-xs text-zinc-500">
            Depoimento de usuário beta. Quando houver autorização escrita, substitua por nome e clube reais.
          </p>
        </figure>
      </div>
    </section>
  );
};
