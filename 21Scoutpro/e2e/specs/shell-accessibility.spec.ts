import { expect, test, type Page } from '@playwright/test';
import { COLLECTION_EXPERIENCE_STORAGE_KEY } from '../../utils/collectionExperience';
import {
  abrirColetaQaEmTempoReal,
  normalizarPartidaQaEmTempoReal,
} from '../helpers/scout-flow';

async function preferShell(page: Page) {
  await page.addInitScript(
    ({ key }) => window.localStorage.setItem(key, 'shell'),
    { key: COLLECTION_EXPERIENCE_STORAGE_KEY }
  );
}

async function startOrResumeClock(page: Page) {
  const action = page.locator(
    '[data-testid="shell-clock-start"], [data-testid="shell-clock-continue"]'
  );
  await expect(action.first()).toBeVisible();
  await action.first().click();
}

test.describe.serial('Acessibilidade e prontidão operacional do Shell', () => {
  test.beforeEach(async () => {
    await normalizarPartidaQaEmTempoReal();
  });

  test('fluxo completo por teclado anuncia estados, respeita redução de movimento e mede interações', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await preferShell(page);
    await abrirColetaQaEmTempoReal(page, 'saved');
    await startOrResumeClock(page);

    const actionHeights = await page
      .locator('[data-testid^="shell-event-"]:visible')
      .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height));
    expect(actionHeights.length).toBeGreaterThan(0);
    expect(Math.min(...actionHeights)).toBeGreaterThanOrEqual(56);

    const utilityHeights = await page
      .locator(
        '[aria-label="Atalhos"], [aria-label^="Desligar som"], [aria-label^="Ligar som"], [data-testid="shell-save"], [data-testid="shell-open-log"]'
      )
      .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height));
    expect(Math.min(...utilityHeights)).toBeGreaterThanOrEqual(44);

    await page.keyboard.press('f');
    await expect(page.getByTestId('shell-live-polite')).toContainText(/Quem finalizou/i);
    await expect
      .poll(() =>
        page.evaluate(() =>
          (document.activeElement as HTMLElement | null)?.dataset.shellAthlete ?? null
        )
      )
      .toBe('true');

    await page.keyboard.press('1');
    await expect(page.getByTestId('shell-live-polite')).toContainText(/resultado/i);
    const reducedTransition = await page
      .locator('[data-shell-option="true"]')
      .first()
      .evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration) || 0);
    expect(reducedTransition).toBeLessThanOrEqual(0.001);

    await page.keyboard.press('3');
    await expect(page.getByTestId('shell-live-assertive')).toContainText(
      /Finalização registrada com sucesso/i
    );
    await expect(page.getByTestId('shell-step')).toHaveText('IDLE', { timeout: 5_000 });

    const metrics = await page.evaluate(() => window.__scout21CollectionShellMetrics__ ?? []);
    expect(metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'shortcut',
          eventId: 'shot',
          inputMethod: 'keyboard',
        }),
        expect.objectContaining({
          type: 'success',
          eventId: 'shot',
          inputMethod: 'keyboard',
          interactionCount: 2,
        }),
      ])
    );
    const summary = await page.evaluate(() =>
      window.__scout21CollectionShellMetricSummary__?.()
    );
    expect(summary).toMatchObject({
      starts: 1,
      successes: 1,
      averageInteractionsPerEvent: 2,
      byInputMethod: { keyboard: 1, touch: 0, preset: 0 },
    });

    await page.keyboard.press('?');
    await expect(page.getByTestId('shell-shortcuts-dialog')).toBeVisible();
    await expect(
      page.getByTestId('shell-shortcuts-dialog').getByRole('button', { name: 'Fechar' })
    ).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('shell-shortcuts-dialog')).toHaveCount(0);
  });

  test('tablet retrato bloqueia somente o Shell e libera ao girar', async ({ page }) => {
    await preferShell(page);
    await abrirColetaQaEmTempoReal(page, 'saved');

    await page.setViewportSize({ width: 820, height: 1180 });
    await expect(page.getByTestId('shell-portrait-blocker')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gire o tablet' })).toBeVisible();
    await expect(page.getByTestId('shell-finalization-start')).toHaveCount(0);

    await page.setViewportSize({ width: 1180, height: 820 });
    await expect(page.getByTestId('shell-portrait-blocker')).toHaveCount(0);
    await expect(page.getByTestId('collection-shell-experimental')).toBeVisible();

    await page.setViewportSize({ width: 1024, height: 768 });
    const railBox = await page.getByRole('complementary', { name: 'Atletas em quadra' }).boundingBox();
    expect(railBox?.width ?? 0).toBeGreaterThan(900);
    expect(railBox?.height ?? 0).toBeGreaterThanOrEqual(90);
    expect(railBox?.height ?? 999).toBeLessThanOrEqual(100);
    const shellOverflow = await page.getByTestId('collection-shell-experimental').evaluate(
      (element) => element.scrollWidth - element.clientWidth
    );
    expect(shellOverflow).toBeLessThanOrEqual(2);

    for (const viewport of [
      { width: 1600, height: 900 },
      { width: 1280, height: 800 },
      { width: 900, height: 600 },
    ]) {
      await page.setViewportSize(viewport);
      await expect(page.getByTestId('collection-shell-experimental')).toBeVisible();
      const overflow = await page.getByTestId('collection-shell-experimental').evaluate(
        (element) => element.scrollWidth - element.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(2);
    }
    await expect(page.getByTestId('shell-viewport-warning')).toBeVisible();
  });

  test('interface atual permanece disponível em tablet retrato', async ({ page }) => {
    await abrirColetaQaEmTempoReal(page, 'saved');
    await page.setViewportSize({ width: 820, height: 1180 });

    await expect(page.getByTestId('shell-portrait-blocker')).toHaveCount(0);
    await expect(page.getByTestId('collection-shell-experimental')).toHaveCount(0);
    await expect(page.getByTestId('event-selector-shot')).toBeVisible();
  });
});
