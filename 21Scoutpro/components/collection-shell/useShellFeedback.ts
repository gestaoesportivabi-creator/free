import { useCallback, useEffect, useRef, useState } from 'react';

const SOUND_STORAGE_KEY = 'scout21_shell_sound_enabled';

export function useShellFeedback() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem(SOUND_STORAGE_KEY) !== 'false';
    } catch {
      return true;
    }
  });
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, String(soundEnabled));
    } catch {
      // Feedback remains usable when storage is unavailable.
    }
  }, [soundEnabled]);

  const success = useCallback(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    if (!reducedMotion && 'vibrate' in navigator) navigator.vibrate?.(18);
    if (!soundEnabled) return;
    try {
      const AudioContextCtor = window.AudioContext;
      const context = audioContextRef.current ?? new AudioContextCtor();
      audioContextRef.current = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.055);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.06);
    } catch {
      // Audio feedback is enhancement-only.
    }
  }, [soundEnabled]);

  return { soundEnabled, setSoundEnabled, success };
}
