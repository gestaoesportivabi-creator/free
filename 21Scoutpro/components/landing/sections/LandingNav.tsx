import React, { useState } from 'react';
import { NewsletterTriggerButton } from '../../NewsletterPopup';
import { scrollToSection } from '../shared/scroll';
import type { LandingPageProps } from '../types';
import { JP7_PATH } from '../../../utils/jacksonPollock7';

const NAV_LINKS = [
  { href: '#perguntas', label: 'Produto' },
  { href: '#assistente', label: 'IA' },
  { href: JP7_PATH, label: 'Calculadora' },
  { href: '#telegram', label: 'Telegram' },
  { href: '#faq', label: 'FAQ' },
] as const;

interface LandingNavProps {
  onGoToSignup?: LandingPageProps['onGoToSignup'];
  onGoToLogin?: LandingPageProps['onGoToLogin'];
  goToSignup: (where: string) => (e: React.MouseEvent) => void;
  goToCalculator: (where: string) => (e: React.MouseEvent) => void;
  trackLogin: (where: string) => void;
  trackBlog: (where: string) => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({
  goToSignup,
  goToCalculator,
  trackLogin,
  trackBlog,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (href: string, where: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith('#')) {
      scrollToSection(e, href);
      setMobileMenuOpen(false);
      return;
    }
    goToCalculator(where)(e);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-3 md:py-4">
        <div className="flex items-center justify-between gap-6">
          <a href="/" className="flex items-center shrink-0" aria-label="SCOUT21 — início">
            <img src="/public-logo.png.png" alt="SCOUT21" className="h-12 md:h-14 w-auto" />
          </a>
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={(e) => handleNavClick(href, 'nav-desktop', e)}
                className={`transition-colors text-sm font-medium ${
                  href === JP7_PATH
                    ? 'text-[#00f0ff] hover:text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {label}
              </a>
            ))}
            <a
              href="/blog"
              onClick={() => trackBlog('nav-desktop')}
              className="text-zinc-400 hover:text-[#00f0ff] transition-colors text-sm font-medium"
            >
              Blog
            </a>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <NewsletterTriggerButton source="nav-desktop" />
            <a
              href="/criar-conta"
              onClick={goToSignup('nav-desktop')}
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#00f0ff] transition-colors text-sm font-medium"
            >
              Teste grátis
            </a>
            <button
              type="button"
              onClick={() => trackLogin('nav-desktop')}
              className="px-4 py-2.5 bg-[#00f0ff] hover:bg-[#00d4e6] text-black font-semibold text-sm uppercase tracking-wider rounded-lg transition-all"
            >
              Login
            </button>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="p-2 text-zinc-400 hover:text-white rounded-lg"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <a
              href={JP7_PATH}
              onClick={goToCalculator('nav-mobile')}
              className="text-[#00f0ff] text-sm font-medium"
            >
              Calculadora
            </a>
            <a
              href="/criar-conta"
              onClick={goToSignup('nav-mobile')}
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#00f0ff] text-sm font-medium"
            >
              Teste grátis
            </a>
            <button
              type="button"
              onClick={() => trackLogin('nav-mobile')}
              className="px-3 py-2 bg-[#00f0ff] text-black font-semibold text-xs uppercase rounded-lg"
            >
              Login
            </button>
          </div>
        </div>
        {mobileMenuOpen ? (
          <div className="md:hidden pt-3 pb-2 border-t border-zinc-800/50 mt-3 flex flex-col gap-2">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={(e) => handleNavClick(href, 'nav-mobile-menu', e)}
                className={`text-sm font-medium py-2 ${
                  href === JP7_PATH ? 'text-[#00f0ff]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {label}
              </a>
            ))}
            <a
              href="/blog"
              onClick={() => trackBlog('nav-mobile-menu')}
              className="text-[#00f0ff] text-sm font-medium py-2"
            >
              Blog
            </a>
            <NewsletterTriggerButton
              source="nav-mobile-menu"
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg border border-[#00f0ff]/40 bg-[#00f0ff]/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#00f0ff]"
            />
          </div>
        ) : null}
      </div>
    </nav>
  );
};
