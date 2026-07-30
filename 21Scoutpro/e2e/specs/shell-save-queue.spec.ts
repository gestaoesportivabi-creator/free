import { expect, test, type Page, type Route } from '@playwright/test';
import { COLLECTION_EXPERIENCE_STORAGE_KEY } from '../../utils/collectionExperience';
import { COLLECTION_SAVE_QUEUE_PREFIX } from '../../utils/collectionSaveQueue';
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

async function queuedEntries(page: Page): Promise<number> {
  return page.evaluate(
    (prefix) =>
      Object.keys(window.localStorage).filter((key) => key.startsWith(prefix)).length,
    COLLECTION_SAVE_QUEUE_PREFIX
  );
}

test('falha de rede preserva fila local e reconcilia quando a conexão volta', async ({ page }) => {
  await normalizarPartidaQaEmTempoReal();
  await preferShell(page);
  await abrirColetaQaEmTempoReal(page, 'scheduled');

  const startOrContinue = page.locator(
    '[data-testid="shell-clock-start"], [data-testid="shell-clock-continue"]'
  );
  await expect(startOrContinue.first()).toBeVisible();
  await startOrContinue.first().click();

  const failMatchWrites = async (route: Route) => {
    if (['POST', 'PUT'].includes(route.request().method())) {
      await route.abort('internetdisconnected');
      return;
    }
    await route.continue();
  };
  await page.route('**/api/matches**', failMatchWrites);

  await page.locator('[data-testid^="shell-player-"]').first().click();
  await page.getByTestId('shell-finalization-start').click();
  await page.getByTestId('shell-shot-result-outside').click();
  await expect(page.getByTestId('shell-step')).toHaveText('IDLE', { timeout: 5_000 });

  await expect.poll(() => queuedEntries(page), { timeout: 10_000 }).toBe(1);
  await expect(page.getByTestId('shell-persistence-state')).toContainText(/na fila/i);

  await page.unroute('**/api/matches**', failMatchWrites);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));

  await expect.poll(() => queuedEntries(page), { timeout: 20_000 }).toBe(0);
  await expect(page.getByTestId('shell-persistence-state')).toContainText(/salvo/i);
});
