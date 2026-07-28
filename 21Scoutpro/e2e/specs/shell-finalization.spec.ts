import { expect, test, type Page } from '@playwright/test';
import {
  abrirDadosDoJogo,
  abrirLogs,
  abrirPartidaQa,
  contarEventosLog,
  fecharLogs,
  iniciarColeta,
  loginComoQa,
  normalizarPartidaQaEmTempoReal,
  obterUltimoEvento,
  salvarPartida,
} from '../helpers/scout-flow';

type CollectionExperience = 'current' | 'shell';

async function navegarParaDashboardComExperiencia(
  page: Page,
  experience?: CollectionExperience
): Promise<void> {
  if (!experience) {
    return;
  }

  const query = experience === 'shell' ? '?coleta=shell' : '?coleta=atual';
  await page.goto(`/dashboard${query}`);
  await expect(page.getByTestId('nav-dados-jogo')).toBeVisible();
}

async function abrirColetaQaEmTempoRealComExperiencia(
  page: Page,
  experience?: CollectionExperience
): Promise<void> {
  await loginComoQa(page);
  await navegarParaDashboardComExperiencia(page, experience);
  await abrirDadosDoJogo(page);
  await abrirPartidaQa(page, 'scheduled');
  await iniciarColeta(page);
}

async function reabrirColetaQaEmTempoRealComExperiencia(
  page: Page,
  experience?: CollectionExperience
): Promise<void> {
  await navegarParaDashboardComExperiencia(page, experience);
  await abrirDadosDoJogo(page);
  await abrirPartidaQa(page, 'saved', 'clock');
  await iniciarColeta(page);
}

test.describe.serial('Shell experimental de Finalizacao', () => {
  test.beforeEach(async () => {
    await normalizarPartidaQaEmTempoReal();
  });

  test('sem flag explicita o fluxo atual continua padrao', async ({ page }) => {
    await abrirColetaQaEmTempoRealComExperiencia(page);

    await expect(page.getByTestId('collection-shell-experimental')).toHaveCount(0);
    await expect(page.getByTestId('event-selector-shot')).toBeVisible();
  });

  test('?coleta=atual continua abrindo o fluxo atual', async ({ page }) => {
    await abrirColetaQaEmTempoRealComExperiencia(page, 'current');

    await expect(page.getByTestId('collection-shell-experimental')).toHaveCount(0);
    await expect(page.getByTestId('event-selector-shot')).toBeVisible();
  });

  test('?coleta=shell ativa o fluxo Evento -> Atleta -> Resultado -> Confirmar', async ({ page }) => {
    await abrirColetaQaEmTempoRealComExperiencia(page, 'shell');

    await expect(page.getByTestId('collection-shell-experimental')).toBeVisible();
    await expect(page.getByTestId('shell-badge')).toHaveText('Shell experimental');
    await expect(page.getByTestId('shell-step')).toHaveText('IDLE');

    await page.getByTestId('shell-clock-start').click();
    await expect(page.getByTestId('shell-clock-state')).toContainText('PRIMEIRO TEMPO');

    await abrirLogs(page);
    const initialLogCount = await contarEventosLog(page);
    await fecharLogs(page);

    await page.getByTestId('shell-finalization-start').click();
    await expect(page.getByTestId('shell-step')).toHaveText('SELECTING_ATHLETE');

    const firstPlayer = page.locator('[data-testid^="shell-player-"]').first();
    await expect(firstPlayer).toBeVisible();
    await firstPlayer.click();
    await expect(page.getByTestId('shell-step')).toHaveText('SELECTING_RESULT');

    await page.getByTestId('shell-back').click();
    await expect(page.getByTestId('shell-step')).toHaveText('SELECTING_ATHLETE');

    await firstPlayer.click();
    await page.getByTestId('shell-cancel').click();
    await expect(page.getByTestId('shell-step')).toHaveText('IDLE');

    await abrirLogs(page);
    expect(await contarEventosLog(page)).toBe(initialLogCount);
    await fecharLogs(page);

    await page.getByTestId('shell-finalization-start').click();
    await firstPlayer.click();
    await page.getByTestId('shell-shot-result-inside').click();
    await expect(page.getByTestId('shell-step')).toHaveText('READY_TO_CONFIRM');

    await page.getByTestId('shell-finalization-confirm').dblclick();
    await expect(page.getByTestId('shell-success')).toBeVisible();
    await expect(page.getByTestId('shell-step')).toHaveText('SUCCESS');

    await expect(page.getByTestId('shell-recent-event').first()).toContainText(/Finaliz|No gol/i);

    await abrirLogs(page);
    expect(await contarEventosLog(page)).toBe(initialLogCount + 1);
    const latestEvent = await obterUltimoEvento(page);
    expect(latestEvent.type).toBe('shot');
    expect(latestEvent.period).toBe('1T');
    expect(latestEvent.time).toMatch(/^\d{2}:\d{2}$/);
    await fecharLogs(page);

    await salvarPartida(page);
    await reabrirColetaQaEmTempoRealComExperiencia(page, 'shell');

    await expect(page.getByTestId('collection-shell-experimental')).toBeVisible();
    await abrirLogs(page);
    expect(await contarEventosLog(page)).toBe(initialLogCount + 1);
    const reopenedEvent = await obterUltimoEvento(page);
    expect(reopenedEvent.type).toBe(latestEvent.type);
    expect(reopenedEvent.period).toBe(latestEvent.period);
    expect(reopenedEvent.time).toBe(latestEvent.time);
  });
});
