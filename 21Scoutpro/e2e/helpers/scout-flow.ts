import { expect, Page } from '@playwright/test';
import { qaEnv } from './env';

type QaMatchKind = 'scheduled' | 'saved' | 'any';

export type LoggedEventSnapshot = {
  period: string;
  time: string;
  type: string;
  text: string;
};

async function isVisible(page: Page, testId: string, timeout = 1500): Promise<boolean> {
  try {
    await page.getByTestId(testId).waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

async function waitForRealtimeScout(page: Page): Promise<void> {
  await page.waitForURL(/\/scout-realtime$/, { timeout: 20_000 });
  await expect(page.getByTestId('match-clock-panel')).toBeVisible();
}

async function ensureAtLeastFivePreparedPlayers(page: Page): Promise<void> {
  const cards = page.locator('[data-testid^="prep-athlete-"]');
  const total = await cards.count();
  if (total === 0) return;

  let selected = 0;
  for (let index = 0; index < total; index += 1) {
    const checkbox = cards.nth(index).locator('input[type="checkbox"]');
    if (await checkbox.isChecked()) {
      selected += 1;
    }
  }

  for (let index = 0; index < total && selected < 5; index += 1) {
    const card = cards.nth(index);
    const checkbox = card.locator('input[type="checkbox"]');
    if (!(await checkbox.isChecked())) {
      await card.click();
      selected += 1;
    }
  }

  expect(selected).toBeGreaterThanOrEqual(5);
}

export async function loginComoQa(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(qaEnv.email);
  await page.getByTestId('login-password').fill(qaEnv.password);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('nav-dados-jogo')).toBeVisible();
}

export async function abrirDadosDoJogo(page: Page): Promise<void> {
  await page.getByTestId('nav-dados-jogo').click();
  await expect(page.getByTestId('match-card').first()).toBeVisible();
}

export async function abrirPartidaQa(page: Page, preferredKind: QaMatchKind = 'any'): Promise<void> {
  const base = page.locator(`[data-testid="match-card"][data-match-opponent="${qaEnv.matchOpponent}"]`);
  const locator =
    preferredKind === 'any'
      ? base.first()
      : page.locator(
          `[data-testid="match-card"][data-match-opponent="${qaEnv.matchOpponent}"][data-match-type="${preferredKind}"]`
        ).first();

  if (preferredKind !== 'any' && (await locator.count()) === 0) {
    await expect(base.first()).toBeVisible();
    await base.first().click();
    return;
  }

  await expect(locator).toBeVisible();
  await locator.click();
}

export async function iniciarColeta(page: Page): Promise<void> {
  if (await isVisible(page, 'reopen-match')) {
    await page.getByTestId('reopen-match').click();
    await waitForRealtimeScout(page);
    return;
  }

  if (await isVisible(page, 'scouting-open-realtime')) {
    await page.getByTestId('scouting-open-realtime').click();
  }

  await ensureAtLeastFivePreparedPlayers(page);

  if (await isVisible(page, 'prep-open-confirm')) {
    await page.getByTestId('prep-open-confirm').click();
    await expect(page.getByTestId('prep-confirm-start-scout')).toBeVisible();
    await page.getByTestId('prep-confirm-start-scout').click();
    await waitForRealtimeScout(page);
    return;
  }

  if (await isVisible(page, 'prep-start-scout')) {
    await page.getByTestId('prep-start-scout').click();
    await waitForRealtimeScout(page);
    return;
  }

  await expect(page.getByTestId('match-clock-panel')).toBeVisible();
}

export async function selecionarAtletaQa(page: Page, playerName = qaEnv.playerName): Promise<void> {
  const preferred = page.locator(`[data-testid^="player-button-"][data-player-name="${playerName}"]`).first();
  if ((await preferred.count()) > 0) {
    await preferred.click();
    return;
  }

  const firstPlayer = page.locator('[data-testid^="player-button-"]').first();
  await expect(firstPlayer).toBeVisible();
  await firstPlayer.click();
}

export async function registrarEvento(
  page: Page,
  event: 'pass-correct' | 'pass-wrong' | 'shot-outside' | 'shot-inside' | 'foul-for' | 'foul-against'
): Promise<void> {
  if (event.startsWith('pass')) {
    const toggle = page.getByTestId('pass-receiver-toggle');
    if ((await toggle.textContent())?.includes('ON')) {
      await toggle.click();
    }
  }

  switch (event) {
    case 'pass-correct':
      await page.getByTestId('event-selector-pass').click();
      await page.getByTestId('event-result-pass-correct').click();
      break;
    case 'pass-wrong':
      await page.getByTestId('event-selector-pass').click();
      await page.getByTestId('event-result-pass-wrong').click();
      break;
    case 'shot-outside':
      await page.getByTestId('event-selector-shot').click();
      await page.getByTestId('event-result-shot-outside').click();
      break;
    case 'shot-inside':
      await page.getByTestId('event-selector-shot').click();
      await page.getByTestId('event-result-shot-inside').click();
      break;
    case 'foul-for':
      await page.getByTestId('event-selector-foul').click();
      await page.getByTestId('event-result-foul-for').click();
      break;
    case 'foul-against':
      await page.getByTestId('event-selector-foul').click();
      await page.getByTestId('event-result-foul-against').click();
      break;
    default:
      throw new Error(`Evento nao suportado: ${event}`);
  }
}

export async function salvarPartida(page: Page): Promise<void> {
  await page.getByTestId('save-match').click();
  await page.waitForURL(/\/dashboard$/, { timeout: 20_000 });
  await expect(page.getByTestId('nav-dados-jogo')).toBeVisible();
}

export async function reabrirPartida(page: Page): Promise<void> {
  await abrirDadosDoJogo(page);
  await abrirPartidaQa(page, 'saved');
  await iniciarColeta(page);
}

export async function abrirLogs(page: Page): Promise<void> {
  await page.getByTestId('logs-open').click();
  await expect(page.getByTestId('event-logs-table')).toBeVisible();
}

export async function fecharLogs(page: Page): Promise<void> {
  await page.getByTestId('logs-close').click();
}

export async function obterUltimoEvento(page: Page): Promise<LoggedEventSnapshot> {
  const row = page.getByTestId('event-log-row').first();
  await expect(row).toBeVisible();

  return {
    period: (await row.getAttribute('data-event-period')) || '',
    time: (await row.getAttribute('data-event-time')) || '',
    type: (await row.getAttribute('data-event-type')) || '',
    text: ((await row.textContent()) || '').replace(/\s+/g, ' ').trim(),
  };
}

export async function sincronizarClock(page: Page, minute: number, second: number): Promise<void> {
  await page.getByTestId('clock-sync').click();
  await expect(page.getByTestId('clock-sync-dialog')).toBeVisible();
  await page.getByTestId('clock-sync-minute').fill(String(minute));
  await page.getByTestId('clock-sync-second').fill(String(second).padStart(2, '0'));
  await page.getByTestId('clock-sync-confirm').click();
  await expect(page.getByTestId('clock-sync-dialog')).not.toBeVisible();
}

export async function abrirColetaQaEmTempoReal(page: Page, preferredKind: QaMatchKind = 'scheduled'): Promise<void> {
  await loginComoQa(page);
  await abrirDadosDoJogo(page);
  await abrirPartidaQa(page, preferredKind);
  await iniciarColeta(page);
}

export async function ensureClockStarted(page: Page): Promise<void> {
  const state = await page.getByTestId('clock-state').textContent();
  if (state?.includes('PRE-JOGO')) {
    await page.getByTestId('clock-start').click();
  } else if (state?.includes('PAUSADO')) {
    await page.getByTestId('clock-continue').click();
  } else if (state?.includes('INTERVALO')) {
    await page.getByTestId('clock-start-second-half').click();
  }
}

export async function readClock(page: Page): Promise<string> {
  return (await page.getByTestId('clock-time').textContent())?.trim() || '00:00';
}
