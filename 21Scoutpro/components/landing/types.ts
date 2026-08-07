export interface LandingPageProps {
  onGetStarted: () => void;
  onGoToLogin?: () => void;
  /**
   * Leva ao cadastro self-service. CTAs de aquisição apontam para cá —
   * WhatsApp fica como suporte. Ver docs/PLANO_MESTRE_TRIAL_30D.md
   */
  onGoToSignup?: () => void;
}

export type SignupWhere =
  | 'nav-desktop'
  | 'nav-mobile'
  | 'hero'
  | 'three-questions'
  | 'ai'
  | 'telegram'
  | 'how-to-start'
  | 'secao-teste-gratis'
  | 'faq'
  | 'cta-final'
  | 'plano-essencial';
