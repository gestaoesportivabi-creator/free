import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronLeft, GripVertical, X } from 'lucide-react';
import { ClockTourStepDefinition } from '../../content/clockProductTour';

interface ClockHelpPanelProps {
  isOpen: boolean;
  step: ClockTourStepDefinition | null;
  currentIndex: number;
  totalSteps: number;
  canGoBack: boolean;
  canGoNext: boolean;
  hasCompleted: boolean;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
  onComplete: () => void;
  onOpenReference: () => void;
}

export const ClockHelpPanel: React.FC<ClockHelpPanelProps> = ({
  isOpen,
  step,
  currentIndex,
  totalSteps,
  canGoBack,
  canGoNext,
  hasCompleted,
  onBack,
  onNext,
  onClose,
  onComplete,
  onOpenReference,
}) => {
  const panelRef = useRef<HTMLElement>(null);
  const dragStartRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

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

  const clampPosition = (left: number, top: number) => {
    const panelBounds = panelRef.current?.getBoundingClientRect();
    if (!panelBounds) return { left, top };

    const inset = 12;
    return {
      left: Math.min(
        Math.max(inset, left),
        Math.max(inset, window.innerWidth - panelBounds.width - inset)
      ),
      top: Math.min(
        Math.max(inset, top),
        Math.max(inset, window.innerHeight - panelBounds.height - inset)
      ),
    };
  };

  const startDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    const panelBounds = panelRef.current?.getBoundingClientRect();
    if (!panelBounds) return;

    dragStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: panelBounds.left,
      top: panelBounds.top,
    };
    setPosition({ left: panelBounds.left, top: panelBounds.top });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const dragPanel = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;

    setPosition(
      clampPosition(
        dragStart.left + event.clientX - dragStart.x,
        dragStart.top + event.clientY - dragStart.y
      )
    );
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current?.pointerId !== event.pointerId) return;
    dragStartRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  if (!isOpen || !step) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[121] flex items-end justify-end p-3 sm:items-start sm:p-4"
    >
      <aside
        ref={panelRef}
        role="complementary"
        aria-modal="false"
        aria-labelledby="clock-help-panel-title"
        data-testid="clock-tour-panel"
        data-step-id={step.id}
        className={`pointer-events-auto flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-zinc-700 bg-black shadow-2xl shadow-black/40 ${
          position ? 'fixed' : ''
        }`}
        style={position ?? undefined}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 sm:px-5">
          <div
            className="-ml-1 flex min-w-0 flex-1 touch-none cursor-grab items-center gap-1 active:cursor-grabbing"
            data-testid="clock-tour-drag-handle"
            onPointerDown={startDragging}
            onPointerMove={dragPanel}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
            aria-label="Arraste o painel do tour para outra posicao"
          >
            <GripVertical size={18} className="shrink-0 text-zinc-600" aria-hidden="true" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#00f0ff]">
                Tour guiado
              </p>
              <h2
                id="clock-help-panel-title"
                className="mt-1 text-lg font-black uppercase tracking-wide text-white"
              >
                Proximo passo da coleta
              </h2>
            </div>
          </div>
          <button
            type="button"
            data-testid="clock-tour-close"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 transition-colors hover:bg-zinc-800"
            aria-label="Fechar tour do cronometro"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              Etapa {Math.min(currentIndex + 1, totalSteps)} de {totalSteps}
            </p>
            {hasCompleted ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
                <Check size={12} />
                Concluido antes
              </span>
            ) : null}
          </div>

          <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4">
            <h3
              data-testid={`clock-tour-step-${step.id}`}
              className="text-base font-black uppercase tracking-wide text-white"
            >
              {step.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{step.body}</p>

            {step.hint ? (
              <div className="mt-4 rounded-2xl border border-[#00f0ff]/35 bg-[#00f0ff]/10 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00f0ff]">
                  Alvo atual
                </p>
                <p className="mt-1 text-sm font-semibold text-white">{step.hint}</p>
              </div>
            ) : null}

            <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/40 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Uso real
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                O tour nao pausa a partida e nao bloqueia seus cliques. Use os controles normalmente.
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="clock-tour-reference"
            onClick={onOpenReference}
            className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-200 transition-colors hover:bg-zinc-800"
          >
            <BookOpen size={14} />
            Abrir guia completo
          </button>

          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <span
                key={index}
                className={`h-1.5 flex-1 rounded-full ${
                  index === currentIndex
                    ? 'bg-[#00f0ff]'
                    : index < currentIndex
                      ? 'bg-emerald-400/70'
                      : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-950/80 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="clock-tour-back"
              onClick={onBack}
              disabled={!canGoBack}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                canGoBack
                  ? 'border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-600'
              }`}
            >
              <ChevronLeft size={14} />
              Voltar
            </button>
            <button
              type="button"
              data-testid="clock-tour-skip"
              onClick={onClose}
              className="inline-flex min-h-[40px] items-center rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-200 transition-colors hover:bg-zinc-800"
            >
              Pular
            </button>
          </div>

          {canGoNext ? (
            <button
              type="button"
              data-testid="clock-tour-next"
              onClick={onNext}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#00f0ff]/50 bg-[#00f0ff]/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#00f0ff] transition-colors hover:bg-[#00f0ff]/20"
            >
              Proximo
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              data-testid="clock-tour-complete"
              onClick={onComplete}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/15 px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-200 transition-colors hover:bg-emerald-500/25"
            >
              <Check size={14} />
              Concluir tour
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};
