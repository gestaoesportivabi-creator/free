import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import {
  abrirColetaQaEmTempoReal,
  abrirLogs,
  contarEventosLog,
  ensureClockStarted,
  fecharLogs,
  normalizarPartidaQaEmTempoReal,
  obterUltimoEvento,
  readClock,
  reabrirPartida,
  registrarEvento,
  salvarPartida,
  selecionarAtletaQa,
  sincronizarClock,
} from '../helpers/scout-flow';

async function readPersistedClockState(
  page: Page,
  matchId: string
): Promise<{
  status: number;
  collectionPhase: number | null;
  hasClockSnapshot: boolean;
  clockSnapshot: { period: string; state: string; currentTimeSeconds: number } | null;
  logCount: number;
}> {
  return page.evaluate(async (currentMatchId) => {
    const token = window.localStorage.getItem('token') || '';
    const response = await fetch(`http://localhost:3000/api/matches/${currentMatchId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = await response.json();
    const data = payload?.data ?? null;
    return {
      status: response.status,
      collectionPhase: data?.collectionPhase ?? null,
      hasClockSnapshot: Boolean(data?.lineup?.clockSnapshot),
      clockSnapshot: data?.lineup?.clockSnapshot
        ? {
            period: data.lineup.clockSnapshot.period,
            state: data.lineup.clockSnapshot.state,
            currentTimeSeconds: data.lineup.clockSnapshot.currentTimeSeconds,
          }
        : null,
      logCount: Array.isArray(data?.postMatchEventLog) ? data.postMatchEventLog.length : 0,
    };
  }, matchId);
}

test.describe.serial('QA restauracao do cronometro em partida incompleta', () => {
  test.beforeEach(async () => {
    await normalizarPartidaQaEmTempoReal();
  });

  test('reabre com o mesmo tempo salvo, preserva periodo e permite continuar a coleta', async ({ page }) => {
    await abrirColetaQaEmTempoReal(page, 'saved');
    const currentMatchId = await page.evaluate(() => {
      const raw = window.localStorage.getItem('realtimeScoutData');
      if (!raw) return null;
      try {
        return JSON.parse(raw)?.matchId ?? null;
      } catch {
        return null;
      }
    });
    expect(currentMatchId).not.toBeNull();

    await ensureClockStarted(page);
    await abrirLogs(page);
    const initialLogCount = await contarEventosLog(page);
    await fecharLogs(page);
    const initialScoreUs = ((await page.getByTestId('score-us').textContent()) || '').trim();
    const initialScoreOpponent = ((await page.getByTestId('score-opponent').textContent()) || '').trim();

    await sincronizarClock(page, 3, 12);
    await expect(page.getByTestId('clock-time')).toHaveText('03:12');

    await selecionarAtletaQa(page);
    await registrarEvento(page, 'pass-correct');

    await page.getByTestId('clock-pause').click();
    await expect(page.getByTestId('clock-state')).toHaveText(/PAUSADO/);

    const savedClock = await readClock(page);
    expect(savedClock).toMatch(/^\d{2}:\d{2}$/);

    await abrirLogs(page);
    const firstSavedEvent = await obterUltimoEvento(page);
    expect(await contarEventosLog(page)).toBe(initialLogCount + 1);
    expect(firstSavedEvent.period).toBe('1T');
    expect(firstSavedEvent.time).toMatch(/^\d{2}:\d{2}$/);
    await fecharLogs(page);

    await salvarPartida(page);
    await expect
      .poll(async () => readPersistedClockState(page, currentMatchId ?? ''), {
        timeout: 15_000,
      })
      .toMatchObject({
        status: 200,
        collectionPhase: 1,
        hasClockSnapshot: true,
        clockSnapshot: {
          period: '1T',
          state: 'PAUSADO',
          currentTimeSeconds: Number(savedClock.split(':')[0]) * 60 + Number(savedClock.split(':')[1]),
        },
        logCount: initialLogCount + 1,
      });
    await reabrirPartida(page, currentMatchId ?? undefined);

    await expect(page.getByTestId('clock-state')).toHaveText(/PAUSADO/);
    await expect(page.getByTestId('clock-time')).toHaveText(savedClock);

    await abrirLogs(page);
    const reopenedEvent = await obterUltimoEvento(page);
    expect(await contarEventosLog(page)).toBe(initialLogCount + 1);
    expect(reopenedEvent.type).toBe(firstSavedEvent.type);
    expect(reopenedEvent.period).toBe(firstSavedEvent.period);
    expect(reopenedEvent.time).toBe(firstSavedEvent.time);
    await fecharLogs(page);

    await expect(page.getByTestId('clock-continue')).toBeVisible();
    await page.getByTestId('clock-continue').click();
    await expect(page.getByTestId('clock-state')).toHaveText(/PRIMEIRO TEMPO/);

    await sincronizarClock(page, 3, 40);
    await expect(page.getByTestId('clock-time')).toHaveText('03:40');

    await selecionarAtletaQa(page);
    await registrarEvento(page, 'shot-inside');
    await expect(page.getByTestId('clock-state')).toHaveText(/PRIMEIRO TEMPO/);

    await abrirLogs(page);
    const secondSavedEvent = await obterUltimoEvento(page);
    expect(await contarEventosLog(page)).toBe(initialLogCount + 2);
    expect(secondSavedEvent.type).toBe('shot');
    expect(secondSavedEvent.period).toBe('1T');
    expect(secondSavedEvent.time).toMatch(/^\d{2}:\d{2}$/);
    await fecharLogs(page);

    await page.getByTestId('clock-pause').click();
    await expect(page.getByTestId('clock-state')).toHaveText(/PAUSADO/);
    const secondSavedClock = await readClock(page);

    await salvarPartida(page);
    await reabrirPartida(page, currentMatchId ?? undefined);

    await expect(page.getByTestId('clock-state')).toHaveText(/PAUSADO/);
    await expect(page.getByTestId('clock-time')).toHaveText(secondSavedClock);

    await abrirLogs(page);
    const lastReopenedEvent = await obterUltimoEvento(page);
    expect(await contarEventosLog(page)).toBe(initialLogCount + 2);
    expect(lastReopenedEvent.type).toBe(secondSavedEvent.type);
    expect(lastReopenedEvent.period).toBe(secondSavedEvent.period);
    expect(lastReopenedEvent.time).toBe(secondSavedEvent.time);
    await fecharLogs(page);

    await expect(page.getByTestId('score-us')).toHaveText(initialScoreUs);
    await expect(page.getByTestId('score-opponent')).toHaveText(initialScoreOpponent);
  });
});
