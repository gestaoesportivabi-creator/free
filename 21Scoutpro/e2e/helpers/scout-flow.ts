import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, Page } from '@playwright/test';
import { qaEnv } from './env';

type QaMatchKind = 'scheduled' | 'saved' | 'any';
type QaMatchTarget = 'clock' | 'postmatch';

const backendDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../backend');

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

async function isRealtimeCollectionReady(page: Page): Promise<boolean> {
  if (await isVisible(page, 'match-clock-panel', 250)) {
    return true;
  }

  if (await isVisible(page, 'collection-shell-experimental', 250)) {
    return true;
  }

  return false;
}

async function waitForRealtimeScout(page: Page): Promise<void> {
  await page.waitForURL(/\/scout-realtime(?:\?.*)?$/, { timeout: 20_000 });

  const startedAt = Date.now();
  while (Date.now() - startedAt < 12_000) {
    if (await handleRealtimeLineupModal(page)) {
      return;
    }

    if (await isRealtimeCollectionReady(page)) {
      return;
    }

    await page.waitForTimeout(250);
  }

  await expect
    .poll(async () => isRealtimeCollectionReady(page), {
      timeout: 10_000,
      message: 'Esperava a coleta realtime abrir no fluxo atual ou no shell experimental.',
    })
    .toBe(true);
}

async function dismissNewsletterModal(page: Page): Promise<void> {
  const newsletterDialog = page.getByRole('dialog').filter({ hasText: /Newsletter SCOUT21|Receba insights de futsal que viram resultado/i });
  if (!(await newsletterDialog.isVisible().catch(() => false))) {
    return;
  }

  const closeButton = newsletterDialog.getByRole('button', { name: /^Fechar$/i }).first();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click({ force: true });
    await newsletterDialog.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
    return;
  }

  const buttons = newsletterDialog.locator('button');
  const buttonCount = await buttons.count();
  if (buttonCount > 0) {
    await buttons.nth(0).click({ force: true });
    await newsletterDialog.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
  }
}

async function resolveLineupConfirmButton(page: Page) {
  const byTestId = page.getByTestId('lineup-confirm-start');
  if (await byTestId.isVisible().catch(() => false)) {
    return byTestId;
  }
  return page.getByRole('button', { name: /Confirmar Escalação e Iniciar Partida/i });
}

async function resolveLineupPlayerOptions(page: Page) {
  const byTestId = page.locator('[data-testid^="lineup-player-option-"]');
  if ((await byTestId.count()) > 0) {
    return byTestId;
  }
  return page.locator('button').filter({ hasText: /QA ATLETA/i });
}

async function handleRealtimeLineupModal(page: Page): Promise<boolean> {
  const confirm = await resolveLineupConfirmButton(page);
  if (!(await confirm.waitFor({ state: 'visible', timeout: 250 }).then(() => true).catch(() => false))) {
    return false;
  }

  const options = await resolveLineupPlayerOptions(page);
  let selected = await page.locator('text=Atletas em quadra (').textContent().catch(() => null);

  if (!selected?.includes('(5/5)')) {
    for (let index = 0; index < 5; index += 1) {
      const nextOption = options.first();
      await expect(nextOption).toBeVisible();
      await nextOption.click();
      selected = await page.locator('text=Atletas em quadra (').textContent().catch(() => null);
      if (selected?.includes('(5/5)')) {
        break;
      }
    }
  }

  const ballUs = page.getByTestId('lineup-ball-us');
  if (await ballUs.isVisible().catch(() => false)) {
    await ballUs.click();
  } else {
    await page.getByRole('button', { name: /Nossa Equipe/i }).click();
  }
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await waitForRealtimeScout(page);
  return true;
}

async function settleRealtimeEntry(page: Page): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 20_000) {
    const isRealtimeUrl = /\/scout-realtime(?:\?.*)?$/.test(page.url());
    if (!isRealtimeUrl) {
      const prepStart = page.getByTestId('prep-start-scout');
      const prepOpenConfirm = page.getByTestId('prep-open-confirm');
      if ((await prepStart.isVisible().catch(() => false)) || (await prepOpenConfirm.isVisible().catch(() => false))) {
        return;
      }
    }

    if (await handleRealtimeLineupModal(page)) {
      return;
    }

    if (await isRealtimeCollectionReady(page)) {
      return;
    }

    await page.waitForTimeout(250);
  }

  await expect
    .poll(async () => isRealtimeCollectionReady(page), {
      timeout: 10_000,
      message: 'Esperava a coleta realtime estabilizar no fluxo atual ou no shell experimental.',
    })
    .toBe(true);
}

async function ensureAtLeastFivePreparedPlayers(page: Page): Promise<void> {
  const selectVisiblePrepPlayers = async () => {
    const selectAll = page.getByTestId('prep-select-all');
    if (await selectAll.isVisible().catch(() => false)) {
      await selectAll.click();
    }
  };

  await selectVisiblePrepPlayers();
  const linePlayersFilter = page.getByRole('button', { name: /Atletas de linha/i });
  if (await linePlayersFilter.isVisible().catch(() => false)) {
    await linePlayersFilter.click();
    await selectVisiblePrepPlayers();
  }

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

async function prepararElencoPosJogo(page: Page): Promise<void> {
  const continueButton = page.getByTestId('postmatch-continue');
  if (!(await continueButton.isVisible().catch(() => false))) {
    return;
  }

  const selectAllVisibleGroup = async () => {
    const selectAll = page.getByRole('button', { name: /^Selecionar todos$/i }).first();
    if (await selectAll.isVisible().catch(() => false)) {
      await selectAll.click();
    }
  };

  await selectAllVisibleGroup();

  const linePlayersFilter = page.getByRole('button', { name: /Atletas de linha/i });
  if (await linePlayersFilter.isVisible().catch(() => false)) {
    await linePlayersFilter.click();
    await selectAllVisibleGroup();
  }

  const goalkeepersFilter = page.getByRole('button', { name: /^Goleiros$/i });
  if (await goalkeepersFilter.isVisible().catch(() => false)) {
    await goalkeepersFilter.click();
    await selectAllVisibleGroup();
  }

  if (await continueButton.isDisabled().catch(() => true)) {
    await ensureAtLeastFivePreparedPlayers(page);
  }

  await expect(continueButton).toBeEnabled();
  await continueButton.click();
}

export async function loginComoQa(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('scout21_newsletter_v1', 'dismissed');
  });
  await page.goto('/login');
  await page.getByTestId('login-email').fill(qaEnv.email);
  await page.getByTestId('login-password').fill(qaEnv.password);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('nav-dados-jogo')).toBeVisible();
}

export async function abrirDadosDoJogo(page: Page): Promise<void> {
  await dismissNewsletterModal(page);
  await page.getByTestId('nav-dados-jogo').click();
  const loadingState = page.getByText(/Entrando em quadra/i);
  if (await loadingState.isVisible().catch(() => false)) {
    await loadingState.waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => undefined);
  }
  await expect(page.getByTestId('match-card').first()).toBeVisible({ timeout: 20_000 });
}

export async function normalizarPartidaQaPosJogo(): Promise<void> {
  execFileSync('cmd.exe', ['/c', 'npm run seed:qa-environment'], {
    cwd: backendDir,
    encoding: 'utf-8',
    env: {
      ...process.env,
      ALLOW_QA_SEED: 'true',
    },
  });
}

export async function normalizarPartidaQaEmTempoReal(): Promise<void> {
  execFileSync('cmd.exe', ['/c', 'npm run seed:qa-environment'], {
    cwd: backendDir,
    encoding: 'utf-8',
    env: {
      ...process.env,
      ALLOW_QA_SEED: 'true',
    },
  });
}

export async function abrirColetaQaPosJogo(page: Page, preferredKind: QaMatchKind = 'scheduled'): Promise<void> {
  await loginComoQa(page);
  await abrirDadosDoJogo(page);
  await abrirPartidaQa(page, preferredKind, 'postmatch');

  const selectorVisible = await page
    .getByTestId('scouting-open')
    .waitFor({ state: 'visible', timeout: 5_000 })
    .then(() => true)
    .catch(() => false);

  if (selectorVisible) {
    await expect(page.getByTestId('scouting-open')).toBeVisible();
    await page.getByTestId('scouting-open').click();
    await prepararElencoPosJogo(page);
  } else {
    throw new Error('Nao foi possivel abrir a coleta QA de pos-jogo pelo seletor dedicado. Normalize a partida QA antes do teste quando o card estiver reaproveitando estado salvo.');
  }
  await expect(page.getByTestId('save-match')).toBeVisible();
  await expect(page.getByTestId('postmatch-period-label')).toBeVisible();
  await expect(page.getByTestId('clock-state')).toHaveCount(0);
}

export async function abrirPartidaQa(
  page: Page,
  preferredKind: QaMatchKind = 'any',
  target: QaMatchTarget = 'clock',
  matchId?: string
): Promise<void> {
  if (matchId) {
    const byId = page.locator(`[data-testid="match-card"][data-match-id="${matchId}"]`).first();
    if ((await byId.count()) > 0) {
      await expect(byId).toBeVisible();
      await byId.click();
      return;
    }
  }

  const matchOpponent = target === 'postmatch' ? qaEnv.postmatchOpponent : qaEnv.matchOpponent;
  const matchCompetition = target === 'postmatch' ? qaEnv.postmatchCompetition : qaEnv.matchCompetition;
  const base = page.locator(
    `[data-testid="match-card"][data-match-opponent="${matchOpponent}"][data-match-competition="${matchCompetition}"]`
  );
  const locator =
    preferredKind === 'any'
      ? base.first()
      : page.locator(
          `[data-testid="match-card"][data-match-opponent="${matchOpponent}"][data-match-competition="${matchCompetition}"][data-match-type="${preferredKind}"]`
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
    const openedRealtime = await page
      .waitForURL(/\/scout-realtime(?:\?.*)?$/, { timeout: 5_000 })
      .then(() => true)
      .catch(() => false);

    if (openedRealtime) {
      await settleRealtimeEntry(page);
      return;
    }

    const openedPostmatchSheet = await page
      .getByTestId('collection-status')
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false);

    if (openedPostmatchSheet) {
      return;
    }

    return;
  }

  if (await isVisible(page, 'scouting-open-realtime')) {
    await page.getByTestId('scouting-open-realtime').click();
  }

  await settleRealtimeEntry(page);
  if (await page.getByTestId('match-clock-panel').isVisible().catch(() => false)) {
    return;
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
  const jerseySuffix = playerName.match(/(\d+)\s*$/)?.[1];
  const normalizedJersey = jerseySuffix ? String(Number.parseInt(jerseySuffix, 10)) : null;

  const ensureEnabledPlayers = async () => {
    const enabledPlayers = page.locator('[data-testid^="player-button-"]:not([disabled])');
    if ((await enabledPlayers.count()) > 0) {
      return enabledPlayers;
    }

    const isPostmatch = (await page.getByTestId('clock-state').count()) === 0;
    if (isPostmatch) {
      return enabledPlayers;
    }

    const activesToggle = page.getByTestId('lineup-actives');
    if (!(await activesToggle.isVisible().catch(() => false))) {
      return enabledPlayers;
    }

    await activesToggle.click();
    await page.waitForTimeout(150);
    await activesToggle.click();
    await page.waitForTimeout(150);

    if ((await enabledPlayers.count()) > 0) {
      return enabledPlayers;
    }

    await activesToggle.click();
    const allPlayers = page.locator('[data-testid^="player-button-"]');
    const selectableCount = await allPlayers.count();
    for (let index = 0; index < Math.min(5, selectableCount); index += 1) {
      await allPlayers.nth(index).click();
    }
    await activesToggle.click();
    await page.waitForTimeout(150);

    return enabledPlayers;
  };

  await ensureEnabledPlayers();
  const preferred = page.locator(`[data-testid^="player-button-"][data-player-name="${playerName}"]`).first();
  if ((await preferred.count()) > 0 && !(await preferred.isDisabled().catch(() => true))) {
    await preferred.click();
    return;
  }

  if (normalizedJersey) {
    const byJersey = page
      .locator(`[data-testid^="player-button-"][data-player-jersey="${normalizedJersey}"]`)
      .first();
    if ((await byJersey.count()) > 0 && !(await byJersey.isDisabled().catch(() => true))) {
      await byJersey.click();
      return;
    }
  }

  const firstPlayer = page.locator('[data-testid^="player-button-"]:not([disabled])').first();
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
  const saveButton = page.getByTestId('save-match');
  await expect(saveButton).toBeVisible();
  await saveButton.click();
  await page.waitForURL(/\/dashboard(?:\?.*)?$/, { timeout: 20_000 });
  await page.getByTestId('save-match').waitFor({ state: 'hidden', timeout: 20_000 });
  await expect(page.getByTestId('nav-dados-jogo')).toBeVisible({ timeout: 20_000 });
}

export async function reabrirPartida(page: Page, matchId?: string): Promise<void> {
  await abrirDadosDoJogo(page);
  await abrirPartidaQa(page, 'saved', 'clock', matchId);
  await iniciarColeta(page);
}

export async function reabrirPartidaQaPosJogo(page: Page, matchId?: string): Promise<void> {
  await abrirDadosDoJogo(page);
  await abrirPartidaQa(page, 'saved', 'postmatch', matchId);
  await iniciarColeta(page);
}

export async function abrirLogs(page: Page): Promise<void> {
  await dismissNewsletterModal(page);
  if (await page.getByTestId('event-logs-table').isVisible().catch(() => false)) {
    return;
  }
  await page.getByTestId('logs-open').click();
  await expect(page.getByTestId('event-logs-table')).toBeVisible();
}

export async function fecharLogs(page: Page): Promise<void> {
  if (!(await page.getByTestId('event-logs-table').isVisible().catch(() => false))) {
    return;
  }
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

export async function contarEventosLog(page: Page): Promise<number> {
  return page.getByTestId('event-log-row').count();
}

export async function sincronizarClock(page: Page, minute: number, second: number): Promise<void> {
  await dismissNewsletterModal(page);
  await page.getByTestId('clock-sync').click();
  await expect(page.getByTestId('clock-sync-dialog')).toBeVisible();
  await page.getByTestId('clock-sync-minute').fill(String(minute));
  await page.getByTestId('clock-sync-second').fill(String(second).padStart(2, '0'));
  await page.getByTestId('clock-sync-confirm').click({ force: true });
  await expect(page.getByTestId('clock-sync-dialog')).not.toBeVisible();
}

export async function abrirColetaQaEmTempoReal(page: Page, preferredKind: QaMatchKind = 'scheduled'): Promise<void> {
  await loginComoQa(page);
  await abrirDadosDoJogo(page);
  await abrirPartidaQa(page, preferredKind);
  await iniciarColeta(page);

  const clockStateVisible = await page
    .getByTestId('clock-state')
    .waitFor({ state: 'visible', timeout: 5_000 })
    .then(() => true)
    .catch(() => false);

  if (clockStateVisible) {
    return;
  }

  const collectionStatus = page.getByTestId('collection-status');
  if (!(await collectionStatus.isVisible().catch(() => false))) {
    return;
  }

  const statusText = (await collectionStatus.textContent()) || '';
  if (!statusText.includes('POS-JOGO')) {
    return;
  }

  await page.getByTestId('save-match').click();
  await abrirDadosDoJogo(page);
  await abrirPartidaQa(page, 'saved');
  await iniciarColeta(page);
}

export async function ensureClockStarted(page: Page): Promise<void> {
  await dismissNewsletterModal(page);
  const state = await page.getByTestId('clock-state').textContent();
  if (state?.includes('PRE-JOGO')) {
    await page.getByTestId('clock-start').click();
  } else if (state?.includes('PAUSADO')) {
    await page.getByTestId('clock-continue').click();
  } else if (state?.includes('INTERVALO')) {
    await iniciarSegundoTempo(page);
  }
}

export async function readClock(page: Page): Promise<string> {
  return (await page.getByTestId('clock-time').textContent())?.trim() || '00:00';
}

export async function garantirPosseCom(page: Page): Promise<void> {
  await dismissNewsletterModal(page);
  const button = page.getByRole('button', { name: /^Com posse$/i });
  await expect(button).toBeVisible();
  if (!(await button.isDisabled().catch(() => true))) {
    await button.click();
  }
}

export async function encerrarPrimeiroTempo(page: Page): Promise<void> {
  await dismissNewsletterModal(page);
  const endFirstHalfButton = page.getByTestId('clock-end-first-half');
  await expect(endFirstHalfButton).toBeVisible();
  await endFirstHalfButton.evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByTestId('clock-state')).toHaveText('INTERVALO');
}

export async function iniciarSegundoTempo(page: Page): Promise<void> {
  await dismissNewsletterModal(page);
  const modalResume = page.getByRole('button', { name: /Retomar ap[oó]s o intervalo/i });
  if (await modalResume.isVisible().catch(() => false)) {
    await modalResume.click();
  } else {
    await page.getByTestId('clock-start-second-half').click();
  }
  await expect(page.getByTestId('clock-state')).toHaveText('SEGUNDO TEMPO');
}

export async function encerrarPartida(page: Page): Promise<void> {
  await dismissNewsletterModal(page);
  const endMatchButton = page.getByTestId('clock-end-match');
  await expect(endMatchButton).toBeVisible();
  await endMatchButton.evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByTestId('end-match-dialog')).toBeVisible();
  await dismissNewsletterModal(page);
  await page.getByTestId('end-match-confirm').evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByTestId('end-match-dialog')).not.toBeVisible();
  await expect(page.getByTestId('clock-state')).toHaveText('ENCERRADO');
}

export async function obterEventoRecente(page: Page) {
  const item = page.getByTestId('recent-event-item').last();
  await expect(item).toBeVisible();

  return {
    time: ((await item.getByTestId('recent-event-time').textContent()) || '').trim(),
    player: ((await item.getByTestId('recent-event-player').textContent()) || '').trim(),
    action: ((await item.getByTestId('recent-event-action').textContent()) || '').trim(),
    text: ((await item.textContent()) || '').replace(/\s+/g, ' ').trim(),
  };
}

export async function registrarGolQa(page: Page): Promise<void> {
  await dismissNewsletterModal(page);
  const goalButton = page.getByTestId('event-selector-goal');
  await expect(goalButton).toBeVisible();
  await goalButton.evaluate((button: HTMLButtonElement) => button.click());
  await dismissNewsletterModal(page);
  await page.getByTestId('goal-team-us').evaluate((button: HTMLButtonElement) => button.click());
  await dismissNewsletterModal(page);
  await page.getByRole('button', { name: /^Ataque$/ }).evaluate((button: HTMLButtonElement) => button.click());
  await dismissNewsletterModal(page);
  await page.getByTestId('goal-assist-none').evaluate((button: HTMLButtonElement) => button.click());
}

export async function registrarGolPosJogoQa(
  page: Page,
  options: {
    scorerName: string;
    minute: number;
    second: number;
    assistName?: string | null;
    methodName?: RegExp;
  }
): Promise<void> {
  const { scorerName, minute, second, assistName = null, methodName = /^Ataque$/i } = options;

  await selecionarAtletaQa(page, scorerName);
  await dismissNewsletterModal(page);
  await page.getByTestId('event-selector-goal').evaluate((button: HTMLButtonElement) => button.click());
  await dismissNewsletterModal(page);
  await page.getByTestId('goal-team-us').evaluate((button: HTMLButtonElement) => button.click());
  await dismissNewsletterModal(page);
  await page.getByRole('button', { name: methodName }).evaluate((button: HTMLButtonElement) => button.click());
  await dismissNewsletterModal(page);

  if (assistName) {
    await selecionarAtletaQa(page, assistName);
  } else {
    await page.getByTestId('goal-assist-none').evaluate((button: HTMLButtonElement) => button.click());
  }

  await dismissNewsletterModal(page);
  await page.getByTestId('goal-time-input').fill(`${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`);
  await page.getByTestId('goal-time-confirm').click();
}

export async function definirTempoEventoPosJogo(page: Page, minute: number, second: number): Promise<void> {
  await expect(page.getByTestId('postmatch-event-time-dialog')).toBeVisible();
  await page.getByTestId('postmatch-event-minute').selectOption(String(minute));
  await page.getByTestId('postmatch-event-second').selectOption(String(second));
  await page.getByTestId('postmatch-event-confirm').click();
  await expect(page.getByTestId('postmatch-event-time-dialog')).toBeHidden();
}

export async function irParaSegundoTempoPosJogo(page: Page): Promise<void> {
  const button = page.getByTestId('postmatch-end-first-half');
  await expect(button).toBeVisible();
  await button.click();
  await expect(page.getByTestId('postmatch-period-label')).toContainText('2');
}

export async function voltarAoPrimeiroTempoPosJogo(page: Page): Promise<void> {
  const button = page.getByTestId('postmatch-return-first-half');
  await expect(button).toBeVisible();
  await button.click();
  await expect(page.getByTestId('postmatch-period-label')).toContainText('1');
}
