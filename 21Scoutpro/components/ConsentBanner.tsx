import React, { useEffect, useState } from 'react';
import { grantAnalyticsConsent, denyAnalyticsConsent } from '../utils/analytics';

const KEY = 'scout21_consent_v1';

export const ConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const gaLoaded = Boolean(window.__scout21_analytics_ready);
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(KEY);
    } catch {
      /* ignore */
    }
    if (gaLoaded && !saved) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[60] p-3 md:p-4 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur"
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
        <p className="text-sm text-zinc-300 flex-1">
          Usamos cookies apenas para medir desempenho do site (Google Analytics). Sem anúncios. Podes recusar.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              denyAnalyticsConsent();
              setVisible(false);
            }}
            className="px-3 py-2 text-xs text-zinc-300 border border-zinc-700 rounded-md hover:border-zinc-500"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => {
              grantAnalyticsConsent();
              setVisible(false);
            }}
            className="px-3 py-2 text-xs bg-[#00f0ff] text-black font-semibold rounded-md"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
};
