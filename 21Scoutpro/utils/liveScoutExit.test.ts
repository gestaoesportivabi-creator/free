import { describe, expect, it } from 'vitest';
import { exitLiveScoutToDashboard, shouldClearExplicitStartOnLeave } from './liveScoutExit';
import { performFinalizeNavigation } from './sessionRestore';

describe('saída da coleta ao vivo (P0 Verify 5)', () => {
  it('sem onSoftNavigateDashboard não faz só pushState', () => {
    let pushed: string | null = null;
    let assigned: string | null = null;
    const kind = performFinalizeNavigation({
      hasLiveOpener: false,
      pushState: (url) => {
        pushed = url;
      },
      assign: (url) => {
        assigned = url;
      },
      close: () => {},
    });
    expect(kind).toBe('missing-router');
    expect(pushed).toBeNull();
    expect(assigned).toBeNull();
  });

  it('com onSoftNavigateDashboard troca a rota da App e não dá assign', () => {
    let assigned: string | null = null;
    let routed = 0;
    let kept = 0;
    const kind = exitLiveScoutToDashboard({
      hasLiveOpener: false,
      pushState: () => {},
      assign: (url) => {
        assigned = url;
      },
      close: () => {},
      onSoftNavigateDashboard: () => {
        routed += 1;
      },
      keepSession: () => {
        kept += 1;
      },
    });
    expect(kind).toBe('soft');
    expect(routed).toBe(1);
    expect(kept).toBe(1);
    expect(assigned).toBeNull();
  });

  it('preserva explicitStart e clockSnapshot ao sair da coleta', () => {
    expect(shouldClearExplicitStartOnLeave()).toBe(false);
  });
});
