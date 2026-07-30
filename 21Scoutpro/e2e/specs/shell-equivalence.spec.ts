import { expect, test, type Page } from '@playwright/test';
import {
  abrirDadosDoJogo,
  abrirPartidaQa,
  ensureClockStarted,
  iniciarColeta,
  loginComoQa,
  normalizarPartidaQaEmTempoReal,
  registrarEvento,
  salvarPartida,
  selecionarAtletaQa,
} from '../helpers/scout-flow';
import { qaEnv } from '../helpers/env';

type Experience = 'current' | 'shell';

type NormalizedMatchPayload = {
  events: Array<Record<string, unknown>>;
  substitutions: Array<Record<string, unknown>>;
};

/**
 * Sequência representativa (20 eventos) cobrindo Classes A e B.
 * Penalidade/tiro livre ficam fora desta comparação E2E porque o fluxo atual
 * depende de modais cobertos pelo cronômetro e de estado de posse/faltas;
 * ambos já estão roteados no Shell via registerSharedEvent e cobertos por
 * testes de domínio/preset.
 */
async function openQaCollection(page: Page, experience: Experience): Promise<void> {
  const alreadyLoggedIn = await page.getByTestId('nav-dados-jogo').isVisible().catch(() => false);
  if (!alreadyLoggedIn) {
    await loginComoQa(page);
  }
  await page.goto(`/dashboard?coleta=${experience === 'shell' ? 'shell' : 'atual'}`);
  await expect(page.getByTestId('nav-dados-jogo')).toBeVisible();
  await abrirDadosDoJogo(page);
  await abrirPartidaQa(page, 'scheduled');
  await iniciarColeta(page);
  if (experience === 'shell') {
    const state = (await page.getByTestId('shell-clock-state').textContent()) ?? '';
    if (state.includes('PRE-JOGO')) await page.getByTestId('shell-clock-start').click();
    else if (state.includes('PAUSADO')) await page.getByTestId('shell-clock-continue').click();
  } else {
    await ensureClockStarted(page);
  }
}

async function readSavedPayload(page: Page): Promise<NormalizedMatchPayload> {
  const matchId = await page.evaluate(() => {
    const raw = localStorage.getItem('realtimeScoutData');
    return raw ? String(JSON.parse(raw).matchId ?? '') : '';
  });
  expect(matchId).not.toBe('');
  await salvarPartida(page);

  return page.evaluate(async (id) => {
    const token = localStorage.getItem('token') || '';
    const response = await fetch(`http://localhost:3000/api/matches/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Falha ao buscar partida salva: ${response.status}`);
    const body = await response.json();
    const match = body.data ?? body;
    const ignored = new Set([
      'id',
      'time',
      'recordedByUserId',
      'recordedByName',
      // IDs de atleta mudam a cada seed QA entre as duas metades do teste.
      'playerId',
      'assistPlayerId',
      'kickerId',
    ]);
    const normalize = (value: Record<string, unknown>) =>
      Object.fromEntries(
        Object.entries(value)
          .filter(([key, field]) => !ignored.has(key) && field !== undefined && field !== null)
          .sort(([left], [right]) => left.localeCompare(right))
      );
    return {
      events: (match.postMatchEventLog ?? []).map(normalize),
      substitutions: (match.substitutionHistory ?? []).map((entry: Record<string, unknown>) =>
        normalize(entry)
      ),
    };
  }, matchId);
}

async function resumeCurrentClock(page: Page): Promise<void> {
  await ensureClockStarted(page);
}

async function clickByTestIdNative(page: Page, testId: string): Promise<void> {
  await page.locator(`[data-testid="${testId}"]`).evaluate((element: HTMLElement) => {
    element.click();
  });
}

async function collectCurrentSequence(page: Page): Promise<void> {
  await selecionarAtletaQa(page);

  for (const result of ['shot-inside', 'shot-outside'] as const) {
    await resumeCurrentClock(page);
    await registrarEvento(page, result);
  }
  for (const label of ['Trave', 'Bloqueado'] as const) {
    await resumeCurrentClock(page);
    await page.getByTestId('event-selector-shot').click();
    await page.getByRole('button', { name: label, exact: true }).click();
  }
  await resumeCurrentClock(page);
  await registrarEvento(page, 'shot-inside');
  await resumeCurrentClock(page);
  await registrarEvento(page, 'shot-outside');
  await resumeCurrentClock(page);
  await registrarEvento(page, 'shot-inside');
  await resumeCurrentClock(page);
  await registrarEvento(page, 'shot-outside');

  for (let index = 0; index < 5; index += 1) {
    await resumeCurrentClock(page);
    await registrarEvento(page, 'foul-for');
  }
  await resumeCurrentClock(page);
  await registrarEvento(page, 'foul-against');

  // GOL fica coberta pelo rótulo do cronômetro; clique nativo preserva o handler React.
  await resumeCurrentClock(page);
  await selecionarAtletaQa(page);
  await clickByTestIdNative(page, 'event-selector-goal');
  await expect(page.getByTestId('goal-team-us')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('goal-team-us').click();
  await page.getByRole('button', { name: 'Escanteio', exact: true }).click();
  await page.getByTestId('goal-assist-none').click();

  await resumeCurrentClock(page);
  await clickByTestIdNative(page, 'event-selector-goal');
  await expect(page.getByTestId('goal-team-opponent')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('goal-team-opponent').click();
  await page.getByRole('button', { name: 'Escanteio', exact: true }).click();

  await selecionarAtletaQa(page);
  await resumeCurrentClock(page);
  await clickByTestIdNative(page, 'event-selector-card');
  await page.getByRole('button', { name: 'Amarelo', exact: true }).click();

  await resumeCurrentClock(page);
  await clickByTestIdNative(page, 'event-selector-card-against');
  await page.getByRole('button', { name: 'Amarelo', exact: true }).click();

  for (let index = 0; index < 2; index += 1) {
    await selecionarAtletaQa(page);
    await resumeCurrentClock(page);
    await clickByTestIdNative(page, 'event-selector-corner');
  }
}

async function waitForShellIdle(page: Page): Promise<void> {
  await expect
    .poll(async () => (await page.getByTestId('shell-step').textContent())?.trim() ?? '', {
      timeout: 10_000,
      message: 'Esperava o Shell voltar para IDLE após registrar o evento.',
    })
    .toBe('IDLE');
}

async function shellChoice(page: Page, testId: string): Promise<void> {
  await clickByTestIdNative(page, testId);
}

async function resumeShellClock(page: Page): Promise<void> {
  const state = (await page.getByTestId('shell-clock-state').textContent()) ?? '';
  if (state.includes('PAUSADO')) await page.getByTestId('shell-clock-continue').click();
}

async function collectShellSequence(page: Page): Promise<void> {
  const preferred = page.locator('[data-testid^="shell-player-"]').filter({ hasText: qaEnv.playerName }).first();
  if ((await preferred.count()) > 0) await preferred.click();
  else await page.locator('[data-testid^="shell-player-"]').first().click();

  for (const result of ['inside', 'outside', 'post', 'blocked', 'inside', 'outside', 'inside', 'outside']) {
    await page.getByTestId('shell-finalization-start').click();
    await shellChoice(page, `shell-shot-result-${result}`);
    await waitForShellIdle(page);
    await resumeShellClock(page);
  }

  for (let index = 0; index < 5; index += 1) {
    await page.getByTestId('shell-event-foul').click();
    await shellChoice(page, 'shell-foul-team-for');
    await waitForShellIdle(page);
    await resumeShellClock(page);
  }
  await page.getByTestId('shell-event-foul').click();
  await shellChoice(page, 'shell-foul-team-against');
  await waitForShellIdle(page);
  await resumeShellClock(page);

  await page.getByTestId('shell-event-goal').click();
  await shellChoice(page, 'shell-goal-team-for');
  await shellChoice(page, 'shell-goal-method-Escanteio');
  await clickByTestIdNative(page, 'shell-step-skip-assist');
  await waitForShellIdle(page);
  await resumeShellClock(page);

  await page.getByTestId('shell-event-goal').click();
  await shellChoice(page, 'shell-goal-team-against');
  await shellChoice(page, 'shell-goal-method-Escanteio');
  await waitForShellIdle(page);
  await resumeShellClock(page);

  await page.getByTestId('shell-event-card').click();
  await shellChoice(page, 'shell-card-team-for');
  await shellChoice(page, 'shell-card-cardType-yellow');
  await waitForShellIdle(page);

  await page.getByTestId('shell-event-card').click();
  await shellChoice(page, 'shell-card-team-against');
  await shellChoice(page, 'shell-card-cardType-yellow');
  await waitForShellIdle(page);

  for (let index = 0; index < 2; index += 1) {
    await page.getByTestId('shell-event-corner').click();
    await shellChoice(page, 'shell-corner-team-for');
    await waitForShellIdle(page);
    await resumeShellClock(page);
  }
}

test.describe.serial('equivalência Shell V2 e fluxo atual', () => {
  test('mesma sequência representativa produz payload normalizado idêntico', async ({ page }) => {
    test.setTimeout(720_000);
    await normalizarPartidaQaEmTempoReal();
    await openQaCollection(page, 'current');
    await collectCurrentSequence(page);
    const currentPayload = await readSavedPayload(page);

    await normalizarPartidaQaEmTempoReal();
    await openQaCollection(page, 'shell');
    await collectShellSequence(page);
    const shellPayload = await readSavedPayload(page);

    expect(currentPayload.events).toHaveLength(20);
    expect(shellPayload.events).toHaveLength(20);
    expect(shellPayload).toEqual(currentPayload);
  });
});
