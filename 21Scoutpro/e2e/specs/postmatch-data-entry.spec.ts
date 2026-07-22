import { expect, test } from '@playwright/test';
import {
  abrirColetaQaEmTempoReal,
  abrirLogs,
  contarEventosLog,
  encerrarPrimeiroTempo,
  ensureClockStarted,
  fecharLogs,
  iniciarSegundoTempo,
  reabrirPartida,
  salvarPartida,
  selecionarAtletaQa,
  sincronizarClock,
} from '../helpers/scout-flow';

test.describe.serial('QA compatibilidade do log compartilhado', () => {
  test('persiste corner, card e gol com assistência após save e reabertura', async ({ page }) => {
    await abrirColetaQaEmTempoReal(page, 'saved');
    await ensureClockStarted(page);

    const initialScoreUs = Number.parseInt((await page.getByTestId('score-us').textContent()) || '0', 10);

    await abrirLogs(page);
    const baselineCount = await contarEventosLog(page);
    await fecharLogs(page);

    await sincronizarClock(page, 5, 10);
    await selecionarAtletaQa(page, 'QA ATLETA 02');
    await page.getByTestId('event-selector-corner').click();
    const continueButton = page.getByTestId('clock-continue');
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
    }

    await sincronizarClock(page, 5, 30);
    await selecionarAtletaQa(page, 'QA ATLETA 02');
    await page.getByTestId('event-selector-card').click();
    await page.getByRole('button', { name: /^Amarelo$/i }).first().click();

    await encerrarPrimeiroTempo(page);
    await iniciarSegundoTempo(page);

    await sincronizarClock(page, 1, 15);
    await selecionarAtletaQa(page, 'QA ATLETA 02');
    await page.getByTestId('event-selector-goal').click();
    await page.getByTestId('goal-team-us').click();
    const activePlayers = page.locator('[data-testid^="player-button-"]:not([disabled])');
    const scorerOption = activePlayers.nth(0);
    await expect(scorerOption).toBeVisible();
    await scorerOption.click();
    await page.getByRole('button', { name: /^Ataque$/i }).click();
    await page.getByTestId('goal-assist-none').click();

    await expect(page.getByTestId('score-us')).toHaveText(String(initialScoreUs + 1));

    await abrirLogs(page);
    await expect.poll(() => contarEventosLog(page)).toBe(baselineCount + 3);

    const latestGoal = page.getByTestId('event-log-row').nth(0);
    await expect(latestGoal).toHaveAttribute('data-event-type', 'goal');
    await expect(latestGoal).toHaveAttribute('data-event-period', '2T');
    await expect(latestGoal).toHaveAttribute('data-event-time', '21:15');

    const latestCard = page.getByTestId('event-log-row').nth(1);
    await expect(latestCard).toHaveAttribute('data-event-type', 'card');
    await expect(latestCard).toHaveAttribute('data-event-period', '1T');
    await expect(latestCard).toHaveAttribute('data-event-time', '05:30');

    const latestCorner = page.getByTestId('event-log-row').nth(2);
    await expect(latestCorner).toHaveAttribute('data-event-type', 'corner');
    await expect(latestCorner).toHaveAttribute('data-event-period', '1T');
    await expect(latestCorner).toHaveAttribute('data-event-time', '05:10');

    await salvarPartida(page);
    await reabrirPartida(page);

    await abrirLogs(page);
    await expect.poll(() => contarEventosLog(page)).toBe(baselineCount + 3);

    const reopenedGoal = page.getByTestId('event-log-row').nth(0);
    await expect(reopenedGoal).toHaveAttribute('data-event-type', 'goal');
    await expect(reopenedGoal).toHaveAttribute('data-event-period', '2T');
    await expect(reopenedGoal).toHaveAttribute('data-event-time', '21:15');

    const reopenedCard = page.getByTestId('event-log-row').nth(1);
    await expect(reopenedCard).toHaveAttribute('data-event-type', 'card');
    await expect(reopenedCard).toHaveAttribute('data-event-period', '1T');
    await expect(reopenedCard).toHaveAttribute('data-event-time', '05:30');

    const reopenedCorner = page.getByTestId('event-log-row').nth(2);
    await expect(reopenedCorner).toHaveAttribute('data-event-type', 'corner');
    await expect(reopenedCorner).toHaveAttribute('data-event-period', '1T');
    await expect(reopenedCorner).toHaveAttribute('data-event-time', '05:10');
  });
});
