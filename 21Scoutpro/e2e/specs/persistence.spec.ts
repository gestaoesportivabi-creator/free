import { expect, test } from '@playwright/test';
import {
  abrirColetaQaEmTempoReal,
  abrirLogs,
  ensureClockStarted,
  obterUltimoEvento,
  reabrirPartida,
  registrarEvento,
  salvarPartida,
  selecionarAtletaQa,
  sincronizarClock,
} from '../helpers/scout-flow';

test.describe.serial('QA persistencia e reabertura', () => {
  test('salva dois eventos, reabre e edita o ultimo', async ({ page }) => {
    await abrirColetaQaEmTempoReal(page, 'saved');
    await ensureClockStarted(page);

    await sincronizarClock(page, 2, 10);
    await selecionarAtletaQa(page);
    await registrarEvento(page, 'pass-correct');

    await sincronizarClock(page, 2, 20);
    await selecionarAtletaQa(page);
    await registrarEvento(page, 'shot-inside');

    await abrirLogs(page);
    const beforeSave = await obterUltimoEvento(page);
    expect(beforeSave.type).toBe('shot');

    await salvarPartida(page);
    await reabrirPartida(page);

    await abrirLogs(page);
    const reopened = await obterUltimoEvento(page);
    expect(reopened.type).toBe(beforeSave.type);
    expect(reopened.time).toBe(beforeSave.time);

    const firstRow = page.getByTestId('event-log-row').first();
    await firstRow.getByTestId('event-edit').click();
    await page.getByTestId('edit-event-time').fill('02:25');
    await page.getByTestId('edit-event-confirm').click();

    await salvarPartida(page);
    await reabrirPartida(page);

    await abrirLogs(page);
    const edited = await obterUltimoEvento(page);
    expect(edited.time).toBe('02:25');
  });
});
