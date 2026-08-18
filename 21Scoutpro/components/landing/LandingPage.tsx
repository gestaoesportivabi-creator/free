import React, { useEffect } from 'react';
import { track } from '../../utils/analytics';
import type { LandingPageProps } from './types';
import { LandingNav } from './sections/LandingNav';
import { Hero } from './sections/Hero';
import { Audience } from './sections/Audience';
import { PainPoints } from './sections/PainPoints';
import { ThreeQuestions } from './sections/ThreeQuestions';
import { AiAssistant } from './sections/AiAssistant';
import { TelegramAthlete } from './sections/TelegramAthlete';
import { FeatureGrid } from './sections/FeatureGrid';
import { SocialProof } from './sections/SocialProof';
import { HowToStart } from './sections/HowToStart';
import { FreeTrial } from './sections/FreeTrial';
import { Faq } from './sections/Faq';
import { FinalCta } from './sections/FinalCta';
import { LandingFooter } from './sections/LandingFooter';

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Preciso de cartão para testar?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Não. Nem cartão, nem Pix. Nada é cobrado ao fim dos 30 dias.',
      },
    },
    {
      '@type': 'Question',
      name: 'Meus atletas precisam instalar algo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Não. Respondem pelo Telegram. Também há portal web do atleta.',
      },
    },
    {
      '@type': 'Question',
      name: 'Tem calculadora de % de gordura sem cadastro?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim. Jackson & Pollock 7 dobras + Siri, no mesmo motor da avaliação física do SCOUT21. Um atleta você calcula agora em scout21.com.br/calculadoras/jackson-pollock-7-dobras; o elenco e a tendência ficam no teste grátis.',
      },
    },
    {
      '@type': 'Question',
      name: 'Coleto sozinho durante o jogo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim. A coleta ao vivo foi desenhada para uma pessoa só, com poucos toques por evento.',
      },
    },
  ],
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted: _onGetStarted,
  onGoToLogin,
  onGoToSignup,
  onGoToCalculator,
}) => {
  useEffect(() => {
    document.title = 'SCOUT21 — Prontidão, scout e carga de treino para futsal';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'SCOUT21 responde se o elenco aguenta treinar forte hoje: ACWR 7/28, prontidão, coleta ao vivo e assistente de IA. Teste 30 dias sem cartão.'
      );
    }

    const scriptId = 'scout21-faq-jsonld';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(FAQ_JSON_LD);

    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, []);

  const goToSignup = (where: string) => (event: React.MouseEvent) => {
    if (!onGoToSignup) return;
    event.preventDefault();
    track('cta_signup_click', { where });
    onGoToSignup();
  };

  const trackLogin = (where: string) => {
    track('cta_login_click', { where });
    onGoToLogin?.();
  };

  const trackBlog = (where: string) => track('cta_blog_click', { where });
  const goToCalculator = (where: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    track('cta_calculator_jp7_click', { where });
    if (onGoToCalculator) onGoToCalculator();
    else window.location.assign('/calculadoras/jackson-pollock-7-dobras');
  };

  return (
    <div className="landing-page min-h-screen bg-black text-white">
      <LandingNav
        goToSignup={goToSignup}
        goToCalculator={goToCalculator}
        trackLogin={trackLogin}
        trackBlog={trackBlog}
      />
      <Hero goToSignup={goToSignup} />
      <Audience />
      <PainPoints />
      <ThreeQuestions goToSignup={goToSignup} />
      <AiAssistant goToSignup={goToSignup} />
      <TelegramAthlete goToSignup={goToSignup} />
      <FeatureGrid />
      <SocialProof />
      <HowToStart goToSignup={goToSignup} />
      <FreeTrial goToSignup={goToSignup} />
      <Faq goToSignup={goToSignup} />
      <FinalCta goToSignup={goToSignup} />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
