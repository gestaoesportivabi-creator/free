import { markKeepSessionAfterFinalize } from './openMatchAnalysis';
import { performFinalizeNavigation, type FinalizeNavigationDeps } from './sessionRestore';

/**
 * Saída da coleta ao vivo na mesma aba: sessão e relógio ficam; o App troca a rota.
 * Não usa location.assign (reload). Sem onSoftNavigateDashboard não faz só pushState.
 */
export function exitLiveScoutToDashboard(
  deps: Pick<FinalizeNavigationDeps, 'hasLiveOpener' | 'close' | 'pushState' | 'assign'> & {
    onSoftNavigateDashboard?: () => void;
    keepSession?: () => void;
  }
): ReturnType<typeof performFinalizeNavigation> {
  (deps.keepSession ?? markKeepSessionAfterFinalize)();
  return performFinalizeNavigation({
    hasLiveOpener: deps.hasLiveOpener,
    pushState: deps.pushState,
    assign: deps.assign,
    close: deps.close,
    softRoute: deps.onSoftNavigateDashboard,
  });
}

/** Sair da coleta (voltar/lista) não apaga explicitStart nem clockSnapshot. */
export function shouldClearExplicitStartOnLeave(): boolean {
  return false;
}
