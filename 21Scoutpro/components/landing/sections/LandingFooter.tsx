import React from 'react';
import { track } from '../../../utils/analytics';
import { WhatsAppIcon } from '../shared/WhatsAppIcon';

export const LandingFooter: React.FC = () => (
  <footer className="py-12 px-4 md:px-8 bg-black border-t border-zinc-800">
    <div className="max-w-5xl mx-auto text-center space-y-4">
      <img src="/public-logo.png.png" alt="SCOUT21" className="h-12 w-auto mx-auto" />
      <p className="landing-body text-zinc-500">
        Inteligência de performance para comissões técnicas de futsal
      </p>
      <div className="pt-8 border-t border-zinc-900 space-y-3">
        <p className="landing-body text-zinc-500 text-sm">
          <a
            href="/blog"
            onClick={() => track('cta_blog_click', { where: 'footer' })}
            className="text-[#00f0ff] hover:underline"
          >
            Blog
          </a>
          {' · '}
          <a href="/termos" className="text-zinc-400 hover:text-white">
            Termos
          </a>
          {' · '}
          <a href="/privacidade" className="text-zinc-400 hover:text-white">
            Privacidade
          </a>
        </p>
        <p className="landing-body text-zinc-700 text-xs">© 2026 SCOUT21. Todos os direitos reservados.</p>
      </div>
    </div>

    <a
      href="https://wa.me/5548991486176?text=Olá%2C%20gostaria%20de%20mais%20informações%20sobre%20o%20SCOUT21"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('cta_whatsapp_click', { where: 'floating-widget' })}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white hover:bg-[#20bd5a] hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 focus:ring-offset-black"
      aria-label="Contato pelo WhatsApp"
    >
      <WhatsAppIcon className="w-8 h-8" />
    </a>
  </footer>
);
