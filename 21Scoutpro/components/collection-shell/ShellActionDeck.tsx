import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import { ShellEventPreset, ShellEventSpec } from './types';

interface ShellActionDeckProps {
  specs: ShellEventSpec[];
  enabled: boolean;
  disabledReason?: string | null;
  onStart: (spec: ShellEventSpec, legacyCompatibility?: boolean) => void;
  onPreset: (spec: ShellEventSpec, preset: ShellEventPreset) => void;
}

const toneClasses = {
  finalization: 'border-cyan-400/80 bg-cyan-500/15 text-cyan-50',
  defensive: 'border-sky-400/80 bg-sky-500/15 text-sky-50',
  infraction: 'border-red-400/80 bg-red-500/15 text-red-50',
  setPiece: 'border-orange-400/80 bg-orange-500/15 text-orange-50',
  goal: 'border-emerald-400/80 bg-emerald-500/15 text-emerald-50',
  operational: 'border-zinc-400/80 bg-zinc-500/15 text-white',
};

export const ShellActionDeck: React.FC<ShellActionDeckProps> = ({
  specs,
  enabled,
  disabledReason,
  onStart,
  onPreset,
}) => {
  const [showOverflow, setShowOverflow] = useState(false);
  const [presetSpec, setPresetSpec] = useState<ShellEventSpec | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const visible = specs.filter((spec) => spec.tier !== 'overflow');
  const overflow = specs.filter((spec) => spec.tier === 'overflow');

  const beginLongPress = (spec: ShellEventSpec) => {
    if (!spec.presets?.length) return;
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setPresetSpec(spec);
    }, 400);
  };

  const endLongPress = () => {
    if (longPressTimerRef.current != null) window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  const handleClick = (spec: ShellEventSpec) => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    onStart(spec, spec.testId === 'shell-finalization-start');
  };

  const handleEventKeyDown = (event: React.KeyboardEvent, spec: ShellEventSpec) => {
    if (event.key === 'Enter' && event.shiftKey && spec.presets?.length) {
      event.preventDefault();
      setPresetSpec(spec);
    }
  };

  useEffect(() => {
    if (!presetSpec) return;
    const dialog = document.querySelector<HTMLElement>('[data-testid="shell-preset-dialog"]');
    const buttons = Array.from(dialog?.querySelectorAll<HTMLButtonElement>('button') ?? []);
    buttons[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setPresetSpec(null);
        return;
      }
      if (event.key === 'Tab' && buttons.length > 0) {
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presetSpec]);

  return (
    <section className="shrink-0 border-t border-zinc-700 bg-zinc-950 p-2" aria-label="Eventos">
      {!enabled && <p className="mb-2 text-center text-[10px] font-bold uppercase text-amber-200">{disabledReason}</p>}
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-7">
        {visible.map((spec) => (
          <button
            key={spec.id}
            type="button"
            disabled={!enabled}
            onPointerDown={() => beginLongPress(spec)}
            onPointerUp={endLongPress}
            onPointerLeave={endLongPress}
            onContextMenu={(event) => event.preventDefault()}
            onKeyDown={(event) => handleEventKeyDown(event, spec)}
            onClick={() => handleClick(spec)}
            data-testid={spec.testId ?? `shell-event-${spec.id}`}
            aria-keyshortcuts={spec.shortcut}
            aria-haspopup={spec.presets?.length ? 'dialog' : undefined}
            aria-label={`${spec.label}${spec.presets?.length ? ', Shift Enter abre presets' : ''}`}
            className={`relative min-h-14 rounded-xl border px-3 py-2 text-left transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 ${toneClasses[spec.tone]}`}
          >
            <span className="block text-xs font-black uppercase">{spec.label}</span>
            <span className="absolute right-2 top-2 rounded border border-current/30 px-1.5 text-[9px] font-black">{spec.shortcut}</span>
            {spec.presets?.length ? <span className="absolute bottom-2 right-2 size-1.5 rounded-full bg-current opacity-70" /> : null}
          </button>
        ))}
        {overflow.length > 0 && (
          <button
            type="button"
            data-testid="shell-event-overflow"
            onClick={() => setShowOverflow((value) => !value)}
            aria-expanded={showOverflow}
            aria-controls="shell-event-overflow-panel"
            className="min-h-14 rounded-xl border border-zinc-600 bg-zinc-900 px-3 text-xs font-black uppercase text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            <MoreHorizontal size={16} className="mx-auto" /> Mais
          </button>
        )}
      </div>
      {showOverflow && (
        <div id="shell-event-overflow-panel" className="mt-2 flex flex-wrap gap-2" aria-label="Mais eventos">
          {overflow.map((spec) => (
            <button key={spec.id} type="button" disabled={!enabled} aria-keyshortcuts={spec.shortcut} aria-haspopup={spec.presets?.length ? 'dialog' : undefined} aria-label={`${spec.label}${spec.presets?.length ? ', Shift Enter abre presets' : ''}`} onPointerDown={() => beginLongPress(spec)} onPointerUp={endLongPress} onPointerLeave={endLongPress} onContextMenu={(event) => event.preventDefault()} onKeyDown={(event) => handleEventKeyDown(event, spec)} onClick={() => handleClick(spec)} data-testid={`shell-event-${spec.id}`} className={`min-h-14 min-w-40 rounded-xl border px-3 text-xs font-black uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:opacity-50 ${toneClasses[spec.tone]}`}>
              {spec.label} <span className="ml-2 opacity-60">{spec.shortcut}</span>
            </button>
          ))}
        </div>
      )}
      {presetSpec && (
        <div data-testid="shell-preset-dialog" className="fixed inset-0 z-[260] flex items-end justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label={`Presets de ${presetSpec.label}`}>
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-950 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase text-white">{presetSpec.label} · Presets</h2>
              <button type="button" onClick={() => setPresetSpec(null)} aria-label="Fechar presets" className="grid size-11 place-items-center rounded-lg text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
                <X size={18} />
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {presetSpec.presets?.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  data-testid={`shell-preset-${preset.id}`}
                  onClick={() => {
                    onPreset(presetSpec, preset);
                    setPresetSpec(null);
                  }}
                  className="min-h-14 rounded-xl border border-zinc-600 bg-zinc-900 px-4 text-left text-sm font-bold text-white hover:border-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
