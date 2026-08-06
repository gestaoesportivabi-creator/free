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
    const clockTourPanel = page.getByTestId('clock-tour-panel');
    await expect(clockTourPanel).toBeVisible();
    await expect(clockTourPanel).toHaveAttribute('data-step-id', 'welcome');
    await expect(page.getByTestId('match-clock-panel')).toHaveAttribute(
      'data-tour-highlighted',
      'true'
    );

    await page.waitForTimeout(1200);
    const after = await readClock(page);
    expect(after).not.toBe(before);
    await expect(page.getByTestId('clock-state')).toHaveText(/PRIMEIRO TEMPO|SEGUNDO TEMPO/);

    await page.getByTestId('clock-tour-next').click();
    await expect(clockTourPanel).toHaveAttribute('data-step-id', 'pause-match');
    await expect(page.getByTestId('clock-pause')).toHaveAttribute('data-tour-highlighted', 'true');

    await page.getByTestId('clock-pause').click();
    await expect(page.getByTestId('clock-state')).toHaveText(/PAUSADO/);
    await expect(clockTourPanel).toHaveAttribute('data-step-id', 'continue-match');
    await expect(page.getByTestId('clock-continue')).toHaveAttribute(
      'data-tour-highlighted',
      'true'
    );

    await page.getByTestId('clock-continue').click();
    await expect(page.getByTestId('clock-state')).toHaveText(/PRIMEIRO TEMPO|SEGUNDO TEMPO/);

    await page.getByTestId('clock-tour-next').click();
    await expect(clockTourPanel).toHaveAttribute('data-step-id', 'select-player');
    await expect(page.getByTestId('player-selector-panel')).toHaveAttribute(
      'data-tour-highlighted',
      'true'
    );

    await page.getByTestId('clock-tour-next').click();
    await expect(clockTourPanel).toHaveAttribute('data-step-id', 'register-pass');
    await expect(page.getByTestId('event-selector-pass')).toHaveAttribute(
      'data-tour-highlighted',
      'true'
    );

    await page.getByTestId('clock-tour-skip').click();
    await expect(clockTourPanel).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('clock-state')).toHaveText(/PRIMEIRO TEMPO|SEGUNDO TEMPO/);
  });

  test('conclui o tour e persiste o resultado localmente', async ({ page }) => {
    await abrirColetaQaEmTempoReal(page, 'saved');
    await ensureClockStarted(page);

    await page.getByTestId('clock-help-open').click();
    const clockTourPanel = page.getByTestId('clock-tour-panel');
    await expect(clockTourPanel).toBeVisible();

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const completeButton = page.getByTestId('clock-tour-complete');
      if (await completeButton.isVisible().catch(() => false)) {
        break;
      }
      await page.getByTestId('clock-tour-next').click();
    }

    await expect(page.getByTestId('clock-tour-complete')).toBeVisible();
    await page.getByTestId('clock-tour-complete').click();
    await expect(clockTourPanel).toHaveCount(0);
    await expect(page.getByTestId('clock-help-open')).toHaveText(/Rever tour/);

    const completionFlag = await page.evaluate(() =>
      window.localStorage.getItem('scout21.clockTour.v1.completed')
    );
    expect(completionFlag).toBe('true');
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
