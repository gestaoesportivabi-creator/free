import React from 'react';
import { SectionHeading } from '../shared/SectionHeading';
import { ScreenshotFrame } from '../shared/ScreenshotFrame';
import { useInView } from '../useInView';

export const SocialProof: React.FC = () => {
  const [ref, inView] = useInView();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-16 md:py-20 px-4 md:px-8 bg-zinc-950 border-y border-zinc-800 transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="max-w-4xl mx-auto grid md:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Em campo"
            title="Feito com quem treina futsal de verdade"
            subtitle="Produto em uso por comissões técnicas de futsal no Sul do Brasil. Quer falar com quem já usa? Responda ao e-mail de boas-vindas após o cadastro."
          />
        </div>
        <ScreenshotFrame
          src="/scout21pro-testimonial.jpg"
          alt="Contexto de uso do SCOUT21 em ambiente de comissão técnica"
        />
      </div>
    </section>
  );
};
