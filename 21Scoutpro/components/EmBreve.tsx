import React from 'react';
import { Lock } from 'lucide-react';

const MENSAGEM_EM_BREVE = 'Em breve, estamos desenvolvendo. Entre em contato para mais informações.';

export const EmBreve: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
    <div className="w-20 h-20 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mb-6">
      <Lock className="text-zinc-400" size={40} strokeWidth={1.5} />
    </div>
    <p className="text-zinc-300 text-lg max-w-md leading-relaxed">
      {MENSAGEM_EM_BREVE}
    </p>
    <a
      href="https://wa.me/5548991486176?text=Olá%2C%20gostaria%20de%20sugestões%20e%20informações%20sobre%20o%20SCOUT21PRO."
      target="_blank"
      rel="noopener noreferrer"
      className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white text-sm font-medium rounded-xl transition-colors"
    >
      Entrar em contato
    </a>
  </div>
);
