import { useCallback, useEffect, useState } from 'react';
import {
  OnboardingSnapshot,
  SubscriptionSnapshot,
  accountApi,
} from '../services/api';

/**
 * Estado do teste gratuito e do progresso de ativação.
 *
 * Consulta o servidor em vez de derivar do token: a expiração é calculada por
 * data a cada requisição no backend, e um JWT emitido há 20 dias não sabe disso.
 */

interface UseSubscriptionResult {
  subscription: SubscriptionSnapshot | null;
  onboarding: OnboardingSnapshot | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  clearDemoData: () => Promise<void>;
  isClearingDemo: boolean;
}

export function useSubscription(enabled: boolean): UseSubscriptionResult {
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearingDemo, setIsClearingDemo] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      // Em paralelo: são independentes e o painel espera pelas duas.
      const [sub, onb] = await Promise.all([
        accountApi.getSubscription().catch(() => null),
        accountApi.getOnboarding().catch(() => null),
      ]);
      setSubscription(sub);
      setOnboarding(onb);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setSubscription(null);
      setOnboarding(null);
      return;
    }
    void refresh();
  }, [enabled, refresh]);

  const clearDemoData = useCallback(async () => {
    setIsClearingDemo(true);
    try {
      await accountApi.clearDemoData();
      await refresh();
    } catch {
      // Silencioso: o checklist continua a oferecer a ação.
    } finally {
      setIsClearingDemo(false);
    }
  }, [refresh]);

  return { subscription, onboarding, isLoading, refresh, clearDemoData, isClearingDemo };
}
