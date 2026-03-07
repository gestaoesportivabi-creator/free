import React from 'react';

// Estilos inline para animação shimmer
const shimmerStyle = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`;

if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = shimmerStyle;
    if (!document.head.querySelector('style[data-shimmer]')) {
        styleSheet.setAttribute('data-shimmer', 'true');
        document.head.appendChild(styleSheet);
    }
}

interface LoadingMessageProps {
    activeTab?: string;
}

// Mapeamento de abas para animações e mensagens
const TAB_ANIMATIONS: Record<string, { message: string; animation: 'shield' | 'field' | 'prayer' | 'default' }> = {
    'team': { message: 'Colocando a caneleira...', animation: 'shield' },
    'table': { message: 'Entrando em quadra...', animation: 'field' },
    'championship': { message: 'Carregando tabela de campeonato...', animation: 'field' },
    'time-control': { message: 'Entrando em quadra...', animation: 'field' },
    'general': { message: 'Montando quadro tático...', animation: 'field' },
    'individual': { message: 'Analisando performance...', animation: 'field' },
    'physical': { message: 'Fazendo a oração...', animation: 'prayer' },
    'assessment': { message: 'Fazendo a oração...', animation: 'prayer' },
    'ranking': { message: 'Organizando dados...', animation: 'shield' },
    'video': { message: 'Carregando vídeo...', animation: 'field' },
    'schedule': { message: 'Organizando programação...', animation: 'shield' },
    'settings': { message: 'Ajustando configurações...', animation: 'shield' },
    'dashboard': { message: 'Preparando o ambiente...', animation: 'default' },
    'default': { message: 'Carregando...', animation: 'default' },
};

// Componente de Escudo/Caneleira
const ShieldAnimation: React.FC = () => (
    <div className="relative w-24 h-32">
        {/* Escudo */}
        <svg viewBox="0 0 100 120" className="w-full h-full animate-pulse">
            <defs>
                <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
                </linearGradient>
            </defs>
            {/* Forma do escudo */}
            <path
                d="M50 10 L20 20 L15 60 Q15 90 50 110 Q85 90 85 60 L80 20 Z"
                fill="url(#shieldGradient)"
                stroke="#10b981"
                strokeWidth="2"
                className="animate-pulse"
            />
            {/* Número 21 no escudo */}
            <text
                x="50"
                y="65"
                fontSize="32"
                fill="#10b981"
                textAnchor="middle"
                fontWeight="bold"
                className="animate-pulse"
                opacity="0.9"
            >
                21
            </text>
        </svg>
        {/* Caneleira brilhando */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-20 bg-gradient-to-b from-zinc-700 to-zinc-900 rounded-lg border-2 border-[#10b981]/50 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse"></div>
    </div>
);

// Componente de Quadra/Quadro Tático
const FieldAnimation: React.FC = () => (
    <div className="relative w-32 h-24">
        {/* Quadra de futsal */}
        <div className="relative w-full h-full bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-lg border-2 border-[#10b981]/50 overflow-hidden">
            {/* Linha do meio */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#10b981]/50"></div>
            {/* Círculo central */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-[#10b981]/50"></div>
            {/* Área (semi-círculo) */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-6 border-t-2 border-x-2 border-[#10b981]/50 rounded-t-full"></div>
            {/* Grid tático animado */}
            <div className="absolute inset-0 opacity-20">
                {[0, 1, 2].map((row) => (
                    <div key={row} className="absolute w-full h-0.5 bg-[#10b981]/30" style={{ top: `${(row + 1) * 25}%` }}></div>
                ))}
                {[0, 1, 2].map((col) => (
                    <div key={col} className="absolute h-full w-0.5 bg-[#10b981]/30" style={{ left: `${(col + 1) * 25}%` }}></div>
                ))}
            </div>
            {/* Pontos animados (jogadores) */}
            {[0, 1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className="absolute w-2 h-2 bg-[#10b981] rounded-full animate-pulse"
                    style={{
                        left: `${20 + (i * 15)}%`,
                        top: `${30 + (i % 2) * 40}%`,
                        animationDelay: `${i * 0.2}s`,
                    }}
                ></div>
            ))}
        </div>
        {/* Brilho animado - removido shimmer para simplificar */}
    </div>
);

// Componente de Oração/Terço
const PrayerAnimation: React.FC = () => (
    <div className="relative w-20 h-32 flex flex-col items-center">
        {/* Terço/Cordão */}
        <svg viewBox="0 0 60 100" className="w-full h-full">
            <defs>
                <linearGradient id="beadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
                </linearGradient>
            </defs>
            {/* Cordão */}
            <path
                d="M30 10 Q30 30, 20 40 Q10 50, 10 60 Q10 70, 20 75 Q30 80, 30 90"
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                opacity="0.5"
            />
            <path
                d="M30 10 Q30 30, 40 40 Q50 50, 50 60 Q50 70, 40 75 Q30 80, 30 90"
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                opacity="0.5"
            />
            {/* Contas do terço */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i, index) => {
                const angle = (index / 10) * Math.PI * 2;
                const radius = 25;
                const x = 30 + Math.cos(angle) * radius;
                const y = 50 + Math.sin(angle) * radius;
                return (
                    <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="3"
                        fill="url(#beadGradient)"
                        className="animate-pulse"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    />
                );
            })}
            {/* Cruz no centro */}
            <g transform="translate(30, 50)">
                <rect x="-1" y="-8" width="2" height="16" fill="#10b981" className="animate-pulse" />
                <rect x="-6" y="-1" width="12" height="2" fill="#10b981" className="animate-pulse" />
            </g>
        </svg>
        {/* Mãos em oração (simplificado) */}
        <div className="absolute -bottom-4 flex gap-1">
            <div className="w-3 h-4 bg-gradient-to-b from-[#10b981]/40 to-[#059669]/20 rounded-t-full"></div>
            <div className="w-3 h-4 bg-gradient-to-b from-[#10b981]/40 to-[#059669]/20 rounded-t-full"></div>
        </div>
    </div>
);

// Animação padrão (spinner)
const DefaultAnimation: React.FC = () => (
    <div className="relative w-16 h-16">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#10b981] border-t-transparent"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-[#10b981]/20 rounded-full animate-ping"></div>
        </div>
    </div>
);

export const LoadingMessage: React.FC<LoadingMessageProps> = ({ activeTab = 'dashboard' }) => {
    // Guard clause: Garantir que sempre temos uma configuração válida
    // Usa optional chaining e fallbacks seguros para evitar acesso a propriedades de undefined
    const config = TAB_ANIMATIONS[activeTab] || TAB_ANIMATIONS['default'] || TAB_ANIMATIONS['dashboard'] || {
        message: 'Carregando...',
        animation: 'default' as const
    };
    
    // Guard clause adicional: Verificar se config e config.animation existem antes de usar
    const animationType = config?.animation || 'default';
    
    const renderAnimation = () => {
        // Switch seguro: animationType sempre terá um valor válido devido ao fallback acima
        switch (animationType) {
            case 'shield':
                return <ShieldAnimation />;
            case 'field':
                return <FieldAnimation />;
            case 'prayer':
                return <PrayerAnimation />;
            default:
                return <DefaultAnimation />;
        }
    };

    // Guard clause final: Se config for undefined (não deveria acontecer, mas por segurança)
    if (!config) {
        return (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                    <DefaultAnimation />
                    <p className="text-white font-light text-lg tracking-wider animate-pulse mt-6">
                        Carregando...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
                <div className="mb-6 flex justify-center">
                    {renderAnimation()}
                </div>
                {/* Optional chaining para segurança adicional, mas config já foi validado acima */}
                <p className="text-white font-light text-lg tracking-wider animate-pulse">
                    {config?.message || 'Carregando...'}
                </p>
            </div>
        </div>
    );
};
