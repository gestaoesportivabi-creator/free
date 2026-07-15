import { expect, test } from '@playwright/test';
import {
  abrirColetaQaEmTempoReal,
  abrirLogs,
  ensureClockStarted,
  fecharLogs,
  obterUltimoEvento,
  readClock,
  reabrirPartida,
  registrarEvento,
  salvarPartida,
  selecionarAtletaQa,
} from '../helpers/scout-flow';

test.describe.serial('QA smoke do cronometro e da coleta', () => {
  test('login, abertura da partida, evento simples, save e reabertura', async ({ page }) => {
    await abrirColetaQaEmTempoReal(page, 'scheduled');

    await expect(page.getByTestId('clock-state')).toHaveText(/PRE-JOGO|PRIMEIRO TEMPO|PAUSADO/);
    const beforeStart = await readClock(page);

    await ensureClockStarted(page);
    await expect(page.getByTestId('clock-state')).toHaveText('PRIMEIRO TEMPO');

    await page.waitForTimeout(1200);
    const afterStart = await readClock(page);
    expect(afterStart).not.toBe(beforeStart);

    await selecionarAtletaQa(page);
    await registrarEvento(page, 'pass-correct');

    await abrirLogs(page);
    const latestEvent = await obterUltimoEvento(page);
    expect(latestEvent.type).toBe('pass');
    expect(latestEvent.period).toBe('1T');
    expect(latestEvent.time).toMatch(/^\d{2}:\d{2}$/);
    await fecharLogs(page);

    await salvarPartida(page);
    await reabrirPartida(page);

    await abrirLogs(page);
    const reopenedEvent = await obterUltimoEvento(page);
    expect(reopenedEvent.type).toBe(latestEvent.type);
    expect(reopenedEvent.period).toBe(latestEvent.period);
    expect(reopenedEvent.time).toBe(latestEvent.time);
  });
});
