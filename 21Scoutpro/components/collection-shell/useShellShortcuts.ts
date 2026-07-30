import { useEffect } from 'react';
import { ShellChoiceOption, ShellEligiblePlayer, ShellEventSpec } from './types';

interface UseShellShortcutsOptions {
  enabled: boolean;
  inStep: boolean;
  specs: ShellEventSpec[];
  athletes: ShellEligiblePlayer[];
  options: ShellChoiceOption[];
  onStartEvent: (spec: ShellEventSpec) => void;
  onSelectAthlete: (id: string) => void;
  onSelectOption: (option: ShellChoiceOption) => void;
  onEscape: () => void;
  onConfirm: () => void;
  onSkip?: () => void;
  onUndo: () => void;
  onClockToggle?: () => void;
  onToggleOverlay: () => void;
}

export function useShellShortcuts({
  enabled,
  inStep,
  specs,
  athletes,
  options,
  onStartEvent,
  onSelectAthlete,
  onSelectOption,
  onEscape,
  onConfirm,
  onSkip,
  onUndo,
  onClockToggle,
  onToggleOverlay,
}: UseShellShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      const key = event.key.toLowerCase();

      if ((event.metaKey || event.ctrlKey) && key === 'z') {
        event.preventDefault();
        onUndo();
        return;
      }
      if (event.key === '?') {
        event.preventDefault();
        onToggleOverlay();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape();
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        onConfirm();
        return;
      }
      if (event.code === 'Space' && onClockToggle) {
        event.preventDefault();
        onClockToggle();
        return;
      }
      if (event.key === '0' && inStep && onSkip) {
        event.preventDefault();
        onSkip();
        return;
      }
      if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) {
        const shell = document.querySelector('[data-testid="collection-shell-experimental"]');
        const focusable = Array.from(
          shell?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'
          ) ?? []
        );
        if (focusable.length > 0) {
          event.preventDefault();
          const currentIndex = Math.max(0, focusable.indexOf(document.activeElement as HTMLElement));
          const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
          focusable[(currentIndex + direction + focusable.length) % focusable.length]?.focus();
          return;
        }
      }
      if (/^[1-9]$/.test(event.key)) {
        event.preventDefault();
        const index = Number(event.key) - 1;
        if (inStep && options[index]) onSelectOption(options[index]);
        else if (athletes[index]) onSelectAthlete(athletes[index].id);
        return;
      }
      if (!inStep) {
        const spec = specs.find((candidate) => candidate.shortcut.toLowerCase() === key);
        if (spec) {
          event.preventDefault();
          onStartEvent(spec);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    athletes,
    enabled,
    inStep,
    onClockToggle,
    onConfirm,
    onEscape,
    onSelectAthlete,
    onSelectOption,
    onSkip,
    onStartEvent,
    onToggleOverlay,
    onUndo,
    options,
    specs,
  ]);
}
