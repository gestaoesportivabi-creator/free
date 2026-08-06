import { expect, test } from '@playwright/test';
import {
  abrirColetaQaEmTempoReal,
  ensureClockStarted,
  loginComoQa,
  normalizarPartidaQaEmTempoReal,
  readClock,
} from '../helpers/scout-flow';

test.describe.serial('Central de Ajuda e ajuda contextual do cronometro', () => {
  test.beforeEach(async () => {
    await normalizarPartidaQaEmTempoReal();
  });

  test('exibe Guia de Uso no menu, protege a rota e navega entre topicos', async ({
    page,
  }) => {
    await page.goto('/guia-de-uso');
    await expect(page).toHaveURL(/\/login$/);

    await loginComoQa(page);
    await expect(page.getByTestId('nav-guide')).toBeVisible();

    await page.getByTestId('nav-guide').click();
    await expect(page).toHaveURL(/\/guia-de-uso/);
    await expect(page.getByTestId('usage-guide-page')).toBeVisible();
    await expect(page.getByTestId('guide-nav-comece-por-aqui')).toBeVisible();
    await expect(page.getByTestId('guide-topic-comece-por-aqui')).toBeVisible();

    await page.getByTestId('guide-nav-cronometro').focus();
    await page.keyboard.press('Enter');
    const clockTopic = page.getByTestId('guide-topic-cronometro');
    await expect(clockTopic).toBeVisible();
    await expect(
      clockTopic.getByRole('heading', { name: 'Sincronizar cronometro' })
    ).toBeVisible();
    await expect(clockTopic).toContainText('Partida pausada');

    await page.getByTestId('guide-next-eventos').click();
    await expect(page.getByTestId('guide-topic-eventos')).toBeVisible();

    await page.getByTestId('guide-nav-salvar-continuar').click();
    const saveContinueTopic = page.getByTestId('guide-topic-salvar-continuar');
    await expect(saveContinueTopic).toBeVisible();
    await expect(saveContinueTopic).toContainText('Retomar Coleta');
    await expect(saveContinueTopic).toContainText('Editar Dados da partida');

    await expect(page.getByText('Shell experimental')).toHaveCount(0);
    await expect(page.getByText('dummy-password')).toHaveCount(0);
    await expect(page.getByText('qa.scout21@qa.scout21.local')).toHaveCount(0);

    await page.getByRole('button', { name: /Voltar ao dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('nav-dados-jogo')).toBeVisible();

    await page.goto('/guia-de-uso?origem=boas-vindas');
    await expect(page).toHaveURL(/\/guia-de-uso\?origem=boas-vindas/);
    await expect(page.getByTestId('usage-guide-page')).toBeVisible();
  });

  test('abre ajuda contextual sem pausar a partida e fecha sem alterar a coleta', async ({
    page,
  }) => {
    await abrirColetaQaEmTempoReal(page, 'saved');
    await ensureClockStarted(page);

    await expect(page.getByTestId('clock-state')).toHaveText(/PRIMEIRO TEMPO|SEGUNDO TEMPO/);

    const before = await readClock(page);
    await page.getByTestId('clock-help-open').focus();
    await page.keyboard.press('Enter');
    const clockHelpPanel = page.getByTestId('clock-help-panel');
    await expect(clockHelpPanel).toBeVisible();
    await expect(
      clockHelpPanel.getByRole('heading', { name: 'Como usar o cronometro' })
    ).toBeVisible();
    await expect(clockHelpPanel).toContainText('Retomar Coleta');

    await page.waitForTimeout(1200);
    const after = await readClock(page);
    expect(after).not.toBe(before);
    await expect(page.getByTestId('clock-state')).toHaveText(/PRIMEIRO TEMPO|SEGUNDO TEMPO/);

    await page.keyboard.press('Escape');
    await expect(clockHelpPanel).toHaveCount(0);
    await expect(page.getByTestId('clock-state')).toHaveText(/PRIMEIRO TEMPO|SEGUNDO TEMPO/);
  });

  test('guia funciona em tablet horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await loginComoQa(page);
    await page.goto('/guia-de-uso');

    await expect(page.getByTestId('usage-guide-page')).toBeVisible();
    await expect(page.getByTestId('guide-nav-comece-por-aqui')).toBeVisible();
    await expect(page.getByTestId('guide-topic-comece-por-aqui')).toBeVisible();
  });
});
