import { expect, test } from '@playwright/test';
import {
  abrirColetaQaPosJogo,
  abrirLogs,
  contarEventosLog,
  definirTempoEventoPosJogo,
  fecharLogs,
  irParaSegundoTempoPosJogo,
  normalizarPartidaQaPosJogo,
  registrarGolPosJogoQa,
  reabrirPartidaQaPosJogo,
  registrarEvento,
  salvarPartida,
  selecionarAtletaQa,
} from '../helpers/scout-flow';

function rowByTimeAndType(time: string, type: string) {
  return `[data-testid="event-log-row"][data-event-time="${time}"][data-event-type="${type}"]`;
}

test.describe.serial('QA jornada real de pos-jogo', () => {
  test('abre a partida dedicada, registra eventos manuais e preserva assistencia apos edicao e reabertura', async ({ page }) => {
    await normalizarPartidaQaPosJogo();
    await abrirColetaQaPosJogo(page, 'scheduled');

    await expect(page.getByTestId('postmatch-period-label')).toContainText('1');
    await expect(page.getByTestId('clock-state')).toHaveCount(0);

    await abrirLogs(page);
    await expect.poll(() => contarEventosLog(page)).toBe(0);
    await fecharLogs(page);

    await selecionarAtletaQa(page, 'QA ATLETA 01');
    await registrarEvento(page, 'pass-correct');
    await definirTempoEventoPosJogo(page, 0, 0);

    await selecionarAtletaQa(page, 'QA ATLETA 02');
    await registrarEvento(page, 'shot-outside');
    await definirTempoEventoPosJogo(page, 5, 30);

    await selecionarAtletaQa(page, 'QA ATLETA 03');
    await registrarEvento(page, 'foul-for');
    await definirTempoEventoPosJogo(page, 19, 59);

    await irParaSegundoTempoPosJogo(page);

    await registrarGolPosJogoQa(page, {
      scorerName: 'QA ATLETA 02',
      assistName: 'QA ATLETA 03',
      minute: 20,
      second: 45,
    });

    await registrarGolPosJogoQa(page, {
      scorerName: 'QA ATLETA 04',
      minute: 21,
      second: 10,
    });

    await selecionarAtletaQa(page, 'QA ATLETA 05');
    await registrarEvento(page, 'foul-against');
    await definirTempoEventoPosJogo(page, 22, 10);

    await expect(page.getByTestId('score-us')).toHaveText('2');
    await expect(page.getByTestId('score-opponent')).toHaveText('0');

    await abrirLogs(page);
    await expect.poll(() => contarEventosLog(page)).toBe(6);

    const goalWithAssist = page.locator(rowByTimeAndType('20:45', 'goal')).first();
    await expect(goalWithAssist).toContainText('QA ATLETA 02');
    await expect(goalWithAssist).toContainText('QA ATLETA 03');

    const goalWithoutAssist = page.locator(rowByTimeAndType('21:10', 'goal')).first();
    await expect(goalWithoutAssist).toContainText('QA ATLETA 04');
    await expect(goalWithoutAssist).toContainText(/Sem assist[êe]ncia/i);

    await expect(page.locator(rowByTimeAndType('00:00', 'pass')).first()).toBeVisible();
    await expect(page.locator(rowByTimeAndType('05:30', 'shot')).first()).toBeVisible();
    await expect(page.locator(rowByTimeAndType('19:59', 'foul')).first()).toBeVisible();
    await expect(page.locator(rowByTimeAndType('22:10', 'foul')).first()).toBeVisible();

    await salvarPartida(page);
    await reabrirPartidaQaPosJogo(page);

    await expect(page.getByTestId('score-us')).toHaveText('2');
    await abrirLogs(page);
    await expect.poll(() => contarEventosLog(page)).toBe(6);

    const reopenedGoalWithAssist = page.locator(rowByTimeAndType('20:45', 'goal')).first();
    await expect(reopenedGoalWithAssist).toContainText('QA ATLETA 02');
    await expect(reopenedGoalWithAssist).toContainText('QA ATLETA 03');

    await reopenedGoalWithAssist.getByTestId('event-edit').click();
    await page.getByTestId('edit-event-time').fill('22:05');
    await page.getByTestId('edit-event-assist').selectOption('');
    await page.getByTestId('edit-event-confirm').click();

    const editedGoal = page.locator(rowByTimeAndType('22:05', 'goal')).first();
    await expect(editedGoal).toContainText('QA ATLETA 02');
    await expect(editedGoal).toContainText(/Sem assist[êe]ncia/i);
    await expect(page.getByTestId('score-us')).toHaveText('2');

    await salvarPartida(page);
    await reabrirPartidaQaPosJogo(page);

    await expect(page.getByTestId('score-us')).toHaveText('2');
    await abrirLogs(page);
    await expect.poll(() => contarEventosLog(page)).toBe(6);

    const reopenedEditedGoal = page.locator(rowByTimeAndType('22:05', 'goal')).first();
    await expect(reopenedEditedGoal).toContainText('QA ATLETA 02');
    await expect(reopenedEditedGoal).toContainText(/Sem assist[êe]ncia/i);
    await expect(page.locator(rowByTimeAndType('20:45', 'goal'))).toHaveCount(0);
  });
});
