import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { getUsageGuideSection } from '../../content/usageGuideContent';
import { GuideTopicContent } from './GuideTopicContent';

interface ClockHelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClockHelpPanel: React.FC<ClockHelpPanelProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="clock-help-panel"
      className="fixed inset-0 z-[121] flex items-end justify-end bg-black/40 p-3 backdrop-blur-[1px] sm:items-start sm:p-4"
    >
      <aside
        role="dialog"
        aria-modal="false"
        aria-labelledby="clock-help-panel-title"
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-zinc-700 bg-black shadow-2xl shadow-black/40"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 sm:px-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#00f0ff]">
              Ajuda rapida
            </p>
            <h2
              id="clock-help-panel-title"
              className="mt-1 text-lg font-black uppercase tracking-wide text-white"
            >
              Como usar o cronometro
            </h2>
          </div>
          <button
            type="button"
            data-testid="clock-help-close"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 transition-colors hover:bg-zinc-800"
            aria-label="Fechar ajuda do cronometro"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-3 sm:p-4">
          <GuideTopicContent section={getUsageGuideSection('cronometro')} compact />
        </div>
      </aside>
    </div>
  );
};
