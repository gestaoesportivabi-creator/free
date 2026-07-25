import { expect, test } from '@playwright/test';
import {
  abrirColetaQaEmTempoReal,
  encerrarPartida,
  encerrarPrimeiroTempo,
  ensureClockStarted,
  iniciarSegundoTempo,
  normalizarPartidaQaEmTempoReal,
  readClock,
  registrarEvento,
  selecionarAtletaQa,
  sincronizarClock,
} from '../helpers/scout-flow';

test.describe.serial('QA controles do cronometro', () => {
  test.beforeEach(async () => {
    await normalizarPartidaQaEmTempoReal();
  });

  test('inicia o cronometro e avanca o relogio', async ({ page }) => {
    await abrirColetaQaEmTempoReal(page, 'saved');
    await ensureClockStarted(page);
    await expect(page.getByTestId('clock-state')).toHaveText(/PRIMEIRO TEMPO|SEGUNDO TEMPO/);

    const before = await readClock(page);
    await page.waitForTimeout(1200);
    const after = await readClock(page);
    expect(after).not.toBe(before);
  });

  test('pausa manualmente e retoma', async ({ page }) => {
    await abrirColetaQaEmTempoReal(page, 'saved');
    await ensureClockStarted(page);

    await page.getByTestId('clock-pause').click();
    await expect(page.getByTestId('clock-state')).toHaveText('PAUSADO');
    const paused = await readClock(page);
    await page.waitForTimeout(1200);
    expect(await readClock(page)).toBe(paused);

    await page.getByTestId('clock-continue').click();
    await expect(page.getByTestId('clock-state')).toHaveText(/PRIMEIRO TEMPO|SEGUNDO TEMPO/);
  });

  test('sincroniza, cancela e rejeita entradas invalidas', async ({ page }) => {
    await abrirColetaQaEmTempoReal(page, 'saved');
    await ensureClockStarted(page);

    await sincronizarClock(page, 1, 15);
    await expect(page.getByTestId('clock-time')).toHaveText('01:15');

    await page.getByTestId('clock-sync').click();
    await page.getByTestId('clock-sync-minute').fill('2');
    await page.getByTestId('clock-sync-second').fill('30');
    await page.getByTestId('clock-sync-cancel').click();
    await expect(page.getByTestId('clock-time')).toHaveText('01:15');

    await page.getByTestId('clock-sync').click();
    await page.getByTestId('clock-sync-minute').fill('');
    await page.getByTestId('clock-sync-second').fill('60');
    await page.getByTestId('clock-sync-confirm').click();
    await expect(page.getByTestId('clock-sync-error')).toBeVisible();
  });

  test('mantem relogio em evento nao pausavel e pausa em evento pausavel', async ({ page }) => {
    await abrirColetaQaEmTempoReal(page, 'saved');
    await ensureClockStarted(page);

    await selecionarAtletaQa(page);
    await registrarEvento(page, 'pass-correct');
    await expect(page.getByTestId('clock-state')).toHaveText(/PRIMEIRO TEMPO|SEGUNDO TEMPO/);

    await selecionarAtletaQa(page);
    await registrarEvento(page, 'shot-outside');
    await expect(page.getByTestId('clock-state')).toHaveText('PAUSADO');
    await page.getByTestId('clock-continue').click();
  });

  test('fecha o primeiro tempo, entra no intervalo e inicia o segundo tempo', async ({ page }) => {
    await abrirColetaQaEmTempoReal(page, 'saved');
    await ensureClockStarted(page);

    await encerrarPrimeiroTempo(page);
    await expect(page.getByTestId('collection-status')).toContainText('Inicie o segundo tempo');
    await iniciarSegundoTempo(page);
    await expect(page.getByTestId('collection-status')).toContainText('Encerre a partida');
  });

  test('encerra a partida e libera a finalizacao', async ({ page }) => {
    await abrirColetaQaEmTempoReal(page, 'saved');
    await ensureClockStarted(page);

    const state = (await page.getByTestId('clock-state').textContent()) || '';
    if (state.includes('PRIMEIRO TEMPO')) {
      await encerrarPrimeiroTempo(page);
      await iniciarSegundoTempo(page);
    } else if (state.includes('INTERVALO')) {
      await iniciarSegundoTempo(page);
    }

    await page.getByTestId('clock-end-match').evaluate((button: HTMLButtonElement) => button.click());
    await expect(page.getByTestId('end-match-dialog')).toBeVisible();
    await expect(page.getByTestId('end-match-dialog')).toContainText('Encerrar partida');
    await expect(page.getByTestId('end-match-dialog')).toContainText('coleta ficará pronta para finalização');
    await page.getByTestId('end-match-cancel').click();
    await expect(page.getByTestId('end-match-dialog')).not.toBeVisible();

    await encerrarPartida(page);
    await expect(page.getByTestId('collection-status')).toContainText('Partida encerrada');
    await expect(page.getByTestId('end-collection')).toBeEnabled();
  });
});
