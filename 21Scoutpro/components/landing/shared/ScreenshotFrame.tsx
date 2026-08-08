import React from 'react';

/**
 * Moldura para capturas reais do produto.
 *
 * Um print solto no meio da página parece recorte de tutorial. Dentro de uma
 * janela — com barra de título, semáforo e sombra — lê-se como software de
 * verdade, e é isso que dá credibilidade a tudo o que a página afirma.
 *
 * As imagens vêm de `public/shots/`, geradas por `scripts/capture-landing-shots.ts`
 * a partir da conta de demonstração. Nenhum dado real de atleta é exposto.
 */

type FrameVariant = 'browser' | 'tablet' | 'bare';

interface ScreenshotFrameProps {
  src: string;
  alt: string;
  /** Só a imagem do hero deve usar `priority` — as demais carregam sob demanda. */
  priority?: boolean;
  className?: string;
  caption?: string;
  variant?: FrameVariant;
  /** Rótulo na barra do navegador. Ajuda a situar a tela mostrada. */
  label?: string;
  /** Recorta a altura para focar no topo da tela, evitando faixas vazias. */
  maxAspect?: string;
}

const TrafficLights: React.FC = () => (
  <div className="flex items-center gap-1.5" aria-hidden="true">
    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
    <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
    <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
  </div>
);

export const ScreenshotFrame: React.FC<ScreenshotFrameProps> = ({
  src,
  alt,
  priority = false,
  className = '',
  caption,
  variant = 'browser',
  label,
  maxAspect,
}) => {
  const img = (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover object-top"
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      {...(priority ? { fetchPriority: 'high' as const } : {})}
    />
  );

  const media = (
    <div className="relative w-full overflow-hidden bg-black" style={maxAspect ? { aspectRatio: maxAspect } : undefined}>
      {img}
    </div>
  );

  return (
    <figure className={`relative ${className}`}>
      {/* Brilho ciano por baixo — dá profundidade sem competir com a imagem. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-[#00f0ff]/[0.07] blur-3xl"
      />

      <div className="relative rounded-xl overflow-hidden border border-zinc-700/70 bg-zinc-950 shadow-[0_28px_70px_-20px_rgba(0,0,0,0.95)] ring-1 ring-white/[0.04]">
        {variant === 'browser' && (
          <div className="flex items-center gap-3 px-3.5 py-2.5 bg-zinc-900/90 border-b border-zinc-800">
            <TrafficLights />
            <div className="flex-1 min-w-0">
              <div className="mx-auto max-w-[22rem] rounded-md bg-black/60 border border-zinc-800 px-3 py-1">
                <span className="block truncate text-[11px] text-zinc-500 text-center font-mono">
                  {label ?? 'scout21.com.br'}
                </span>
              </div>
            </div>
            {/* Espaçador com a mesma largura do semáforo, para centrar a barra. */}
            <div className="w-[46px]" aria-hidden="true" />
          </div>
        )}

        {variant === 'tablet' ? (
          <div className="p-2.5 bg-zinc-900">
            <div className="rounded-lg overflow-hidden border border-zinc-800">{media}</div>
          </div>
        ) : (
          media
        )}
      </div>

      {caption ? (
        <figcaption className="mt-3 text-xs text-zinc-500 landing-body text-center">{caption}</figcaption>
      ) : null}
    </figure>
  );
};
