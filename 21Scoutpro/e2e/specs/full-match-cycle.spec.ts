import { expect, test, Page } from '@playwright/test';
import {
  abrirDadosDoJogo,
  abrirPartidaQa,
  abrirColetaQaEmTempoReal,
  abrirLogs,
  contarEventosLog,
  encerrarPartida,
  encerrarPrimeiroTempo,
  ensureClockStarted,
  fecharLogs,
  garantirPosseCom,
  iniciarColeta,
  iniciarSegundoTempo,
  normalizarPartidaQaEmTempoReal,
  obterEventoRecente,
  obterUltimoEvento,
  reabrirPartida,
  registrarEvento,
  registrarGolQa,
  selecionarAtletaQa,
  sincronizarClock,
} from '../helpers/scout-flow';

async function aceitarProximoDialogo(page: Page): Promise<void> {
  page.once('dialog', (dialog) => dialog.accept());
}

async function continuarSePausado(page: Page): Promise<void> {
  const state = (await page.getByTestId('clock-state').textContent()) || '';
  if (state.includes('PAUSADO')) {
    await page.getByTestId('clock-continue').click();
  }
}

async function abrirColetaQaRepetivel(page: Page): Promise<void> {
  await abrirColetaQaEmTempoReal(page, 'saved');

  const abriuRealtime = await page
    .getByTestId('clock-state')
    .waitFor({ state: 'visible', timeout: 5_000 })
    .then(() => true)
    .catch(() => false);

  if (abriuRealtime) {
    return;
  }

  const collectionStatus = page.getByTestId('collection-status');
  await expect(collectionStatus).toBeVisible();
  await expect(collectionStatus).toContainText('POS-JOGO');

  await page.getByTestId('save-match').click();
  await abrirDadosDoJogo(page);
  await abrirPartidaQa(page, 'saved');
  await iniciarColeta(page);
  await expect(page.getByTestId('clock-state')).toBeVisible();
}

async function garantirPrimeiroTempo(page: Page): Promise<void> {
  const state = (await page.getByTestId('clock-state').textContent()) || '';

  if (state.includes('INTERVALO')) {
    await iniciarSegundoTempo(page);
  }

  const returnFirstHalf = page.getByTestId('clock-return-first-half');
  if (await returnFirstHalf.isVisible().catch(() => false)) {
    await aceitarProximoDialogo(page);
    await returnFirstHalf.click();
  }

  await ensureClockStarted(page);
  await continuarSePausado(page);
  await expect(page.getByTestId('clock-state')).toHaveText(/PRIMEIRO TEMPO|PAUSADO/);
}

async function registrarEventoEmTempo(
  page: Page,
  minute: number,
  second: number,
  event: Parameters<typeof registrarEvento>[1]
): Promise<void> {
  await sincronizarClock(page, minute, second);
  await garantirPosseCom(page);
  await selecionarAtletaQa(page);
  await registrarEvento(page, event);
  await continuarSePausado(page);
}

test.describe.serial('QA ciclo completo da partida', () => {
  test.beforeEach(async () => {
    await normalizarPartidaQaEmTempoReal();
  });

  test('acumula eventos, registra gol realtime, encerra e reabre a coleta', async ({ page }) => {
    await abrirColetaQaRepetivel(page);
    await garantirPrimeiroTempo(page);

    await abrirLogs(page);
    const baselineCount = await contarEventosLog(page);
    await fecharLogs(page);

    const initialScoreUs = Number.parseInt((await page.getByTestId('score-us').textContent()) || '0', 10);

    await registrarEventoEmTempo(page, 1, 0, 'pass-correct');
    await registrarEventoEmTempo(page, 1, 10, 'shot-inside');
    await registrarEventoEmTempo(page, 1, 20, 'pass-correct');
    await registrarEventoEmTempo(page, 1, 30, 'shot-inside');
    await registrarEventoEmTempo(page, 1, 40, 'pass-correct');

    await abrirLogs(page);
    await expect.poll(() => contarEventosLog(page)).toBe(baselineCount + 5);
    await fecharLogs(page);

    await encerrarPrimeiroTempo(page);
    await expect(page.getByTestId('collection-status')).toContainText('Inicie o segundo tempo');
    await iniciarSegundoTempo(page);

    await registrarEventoEmTempo(page, 2, 0, 'pass-correct');
    await registrarEventoEmTempo(page, 2, 10, 'shot-inside');
    await registrarEventoEmTempo(page, 2, 20, 'pass-correct');
    await registrarEventoEmTempo(page, 2, 30, 'shot-inside');

    await sincronizarClock(page, 2, 40);
    await garantirPosseCom(page);
    await selecionarAtletaQa(page);
    await registrarGolQa(page);

    await expect(page.getByTestId('score-us')).toHaveText(String(initialScoreUs + 1));

    await abrirLogs(page);
    await expect.poll(() => contarEventosLog(page)).toBe(baselineCount + 10);
    const latestGoal = await obterUltimoEvento(page);
    expect(latestGoal.type).toBe('goal');
    expect(latestGoal.period).toBe('2T');
    expect(latestGoal.time).toBe('22:40');
    await fecharLogs(page);

    const recentGoal = await obterEventoRecente(page);
    expect(recentGoal.time).toBe('22:40');
    expect(recentGoal.action).toBe('Gol');
    expect(recentGoal.text).not.toContain('Gol Gol');

    await encerrarPartida(page);
    await expect(page.getByTestId('collection-status')).toContainText('Partida encerrada');
    await expect(page.getByTestId('end-collection')).toBeEnabled();

    await aceitarProximoDialogo(page);
    await page.getByTestId('end-collection').click();
    await page.waitForURL(/\/dashboard$/, { timeout: 20_000 });

    await reabrirPartida(page);
    await expect(page.getByTestId('collection-status')).toContainText('POS-JOGO');
    await abrirLogs(page);
    await expect.poll(() => contarEventosLog(page)).toBe(baselineCount + 10);

    const reopenedLatest = await obterUltimoEvento(page);
    expect(reopenedLatest.type).toBe('goal');
    expect(reopenedLatest.period).toBe('2T');
    expect(reopenedLatest.time).toBe('22:40');

    const reopenedRecentGoal = await obterEventoRecente(page);
    expect(reopenedRecentGoal.time).toBe('22:40');
    expect(reopenedRecentGoal.action).toBe('Gol');
  });
});
