import { expect, test, type Page } from '@playwright/test';
import { COLLECTION_EXPERIENCE_STORAGE_KEY } from '../../utils/collectionExperience';
import {
  abrirColetaQaEmTempoReal,
  abrirColetaQaPosJogo,
  abrirLogs,
  fecharLogs,
  normalizarPartidaQaEmTempoReal,
  normalizarPartidaQaPosJogo,
  obterUltimoEvento,
} from '../helpers/scout-flow';

async function preferShell(page: Page) {
  await page.addInitScript(
    ({ key }) => window.localStorage.setItem(key, 'shell'),
    { key: COLLECTION_EXPERIENCE_STORAGE_KEY }
  );
}

test.describe.serial('Shell REVIEW e RECOVERY', () => {
  test('realtime exclui passe e aplica timestamp editável no domínio', async ({ page }) => {
    await normalizarPartidaQaEmTempoReal();
    await preferShell(page);
    await abrirColetaQaEmTempoReal(page, 'scheduled');

    const startOrContinue = page.locator(
      '[data-testid="shell-clock-start"], [data-testid="shell-clock-continue"]'
    );
    await expect(startOrContinue.first()).toBeVisible();
    await startOrContinue.first().click();
    await page.getByTestId('shell-time-edit').click();
    await page.getByTestId('shell-time-minute').fill('3');
    await page.getByTestId('shell-time-second').fill('12');
    await page.getByTestId('shell-time-apply').click();
    await page.locator('[data-testid^="shell-player-"]').first().click();

    await expect(page.getByTestId('shell-event-pass')).toHaveCount(0);
    await page.getByTestId('shell-finalization-start').click();
    await page.getByTestId('shell-shot-result-outside').click();
    await expect(page.getByTestId('shell-step')).toHaveText('IDLE', { timeout: 5_000 });

    await abrirLogs(page);
    const event = await obterUltimoEvento(page);
    expect(event.type).toBe('shot');
    expect(event.period).toBe('1T');
    expect(event.time).toBe('03:12');
  });

  test('postmatch registra passe enriquecido com receptor, transição, zona e 2T', async ({ page }) => {
    await normalizarPartidaQaPosJogo();
    await preferShell(page);
    await abrirColetaQaPosJogo(page);
    await expect(page.getByTestId('collection-shell-experimental')).toBeVisible();

    await page.getByTestId('shell-time-edit').click();
    await page.getByRole('combobox').selectOption('2T');
    await page.getByTestId('shell-time-minute').fill('3');
    await page.getByTestId('shell-time-second').fill('12');
    await page.getByTestId('shell-time-apply').click();

    const players = page.locator('[data-testid^="shell-player-"]');
    await players.nth(0).click();
    await page.getByTestId('shell-event-pass').click();
    await page.getByTestId('shell-pass-result-wrong').click();
    await players.nth(1).click();
    await page.getByTestId('shell-pass-transition-true').click();
    await page.getByTestId('shell-pass-zone-ataqueDireita').click();
    await expect(page.getByTestId('shell-step')).toHaveText('IDLE', { timeout: 5_000 });

    await abrirLogs(page);
    const event = await obterUltimoEvento(page);
    expect(event.type).toBe('pass');
    expect(event.period).toBe('2T');
    expect(event.time).toBe('23:12');
    expect(event.text).toMatch(/Transição|Errado/i);
    await fecharLogs(page);

    await page.getByTestId('shell-event-keyPass').click();
    await players.nth(1).click();
    await page.getByTestId('shell-step-skip-zone').click();
    await expect(page.getByTestId('shell-step')).toHaveText('IDLE', { timeout: 5_000 });

    await page.getByTestId('shell-event-assist').click();
    await players.nth(1).click();
    await page.getByTestId('shell-step-skip-zone').click();
    await expect(page.getByTestId('shell-step')).toHaveText('IDLE', { timeout: 5_000 });

    await page.getByTestId('shell-event-overflow').click();
    await expect(page.getByTestId('shell-event-lateral')).toBeVisible();
    await page.getByTestId('shell-event-lateral').click();
    await page.getByTestId('shell-lateral-zone-defesaEsquerda').click();
    await expect(page.getByTestId('shell-step')).toHaveText('IDLE', { timeout: 5_000 });

    await abrirLogs(page);
    await expect(page.getByText('Passe-chave', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Assistência avulsa', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Defesa - Esquerda/i).first()).toBeVisible();
  });

  test('reabre incompleta diretamente em RECOVERY sem repetir escalação', async ({ page }) => {
    await normalizarPartidaQaEmTempoReal();
    await preferShell(page);
    await abrirColetaQaEmTempoReal(page, 'saved');

    await expect(page.getByTestId('collection-shell-experimental')).toBeVisible();
    await expect(page.getByTestId('lineup-confirm-start')).toHaveCount(0);
    await expect(page.getByTestId('shell-recovery-notice')).toContainText(/Retomando de \d{2}:\d{2}/);
  });
});
