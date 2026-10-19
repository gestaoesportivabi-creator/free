import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { chromium, type Browser, type Page } from 'playwright';

const SYNC_MESSAGE =
  'Necessário sincronizar o relógio. Esta partida não possui snapshot temporal salvo.';
const FOULS_MESSAGE = 'Disponível após 5 faltas (nossas ou do adversário) neste tempo';
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactDir = '/opt/cursor/artifacts';

async function ensureChromium(): Promise<void> {
  const probe = spawnSync('npx', ['playwright', 'install', 'chromium'], {
    cwd: rootDir,
    stdio: 'inherit',
  });
  if (probe.status !== 0) {
    throw new Error('Não foi possível instalar o Chromium do Playwright.');
  }
}

async function startPreview(): Promise<{ url: string; close: () => Promise<void> }> {
  const dir = await mkdtemp(path.join(tmpdir(), 'freekick-'));
  await esbuild.build({
    absWorkingDir: rootDir,
    entryPoints: ['unit/freeKickPreview.tsx'],
    bundle: true,
    format: 'iife',
    outfile: path.join(dir, 'app.js'),
    jsx: 'automatic',
    banner: { js: 'const process={env:{NODE_ENV:"test"}};' },
  });
  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>TIRO LIVRE</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body style="margin:0;background:#000;color:#fff;font-family:sans-serif;">
    <div id="root"></div>
    <script src="/app.js"></script>
  </body>
</html>`;
  await writeFile(path.join(dir, 'index.html'), html, 'utf8');

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const filePath = url.pathname === '/' ? path.join(dir, 'index.html') : path.join(dir, url.pathname);
    try {
      const body = await readFile(filePath);
      const type = filePath.endsWith('.js') ? 'text/javascript' : 'text/html';
      response.writeHead(200, { 'content-type': type });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end('not found');
    }
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Servidor de preview sem porta.');
  }
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}

async function openMode(page: Page, url: string, mode: string): Promise<void> {
  await page.goto(`${url}/?mode=${mode}`);
  await page.getByTestId('event-selector-freekick').waitFor();
}

describe('TIRO LIVRE — tooltip e aria', { concurrency: 1 }, () => {
  let browser!: Browser;
  let preview!: { url: string; close: () => Promise<void> };

  before(async () => {
    await mkdir(artifactDir, { recursive: true });
    await ensureChromium();
    browser = await chromium.launch();
    preview = await startPreview();
  });

  after(async () => {
    await browser?.close();
    await preview?.close();
  });

  test('faltas insuficientes: aviso no hover e no foco, sem disabled nativo', async () => {
    const page = await browser.newPage({ viewport: { width: 480, height: 420 } });
    await openMode(page, preview.url, 'fouls');
    const button = page.getByTestId('event-selector-freekick');
    const wrap = page.getByTestId('event-selector-freekick-wrap');

    assert.equal(await button.getAttribute('disabled'), null);
    assert.equal(await button.getAttribute('aria-disabled'), 'true');
    assert.equal(await wrap.getAttribute('title'), FOULS_MESSAGE);
    assert.equal(await button.getAttribute('title'), FOULS_MESSAGE);
    assert.equal(await wrap.getAttribute('data-block-reason'), 'fouls');

    const hint = page.getByTestId('tiro-livre-rule-hint');
    assert.equal(await hint.isVisible(), false);
    await button.hover();
    assert.equal(await hint.isVisible(), true);
    assert.equal((await hint.textContent())?.trim(), FOULS_MESSAGE);
    await page.screenshot({ path: path.join(artifactDir, 'tiro-livre-faltas-hover.png') });

    await button.focus();
    assert.equal(await hint.isVisible(), true);
    await page.screenshot({ path: path.join(artifactDir, 'tiro-livre-faltas-foco.png') });

    await button.click({ force: true });
    assert.equal(((await page.getByTestId('freekick-clicks').textContent()) || '').trim(), '0');
    await page.keyboard.press('Enter');
    assert.equal(((await page.getByTestId('freekick-clicks').textContent()) || '').trim(), '0');
    await page.close();
  });

  test('trava de sync mostra o texto do relógio, mesmo com faltas suficientes', async () => {
    const page = await browser.newPage({ viewport: { width: 480, height: 420 } });
    await openMode(page, preview.url, 'realtime');
    const button = page.getByTestId('event-selector-freekick');
    const wrap = page.getByTestId('event-selector-freekick-wrap');
    const hint = page.getByTestId('tiro-livre-rule-hint');

    assert.equal(await button.getAttribute('disabled'), null);
    assert.equal(await button.getAttribute('aria-disabled'), 'true');
    assert.equal(await wrap.getAttribute('data-block-reason'), 'realtime');
    assert.equal(await button.getAttribute('title'), SYNC_MESSAGE);
    assert.notEqual(await button.getAttribute('title'), FOULS_MESSAGE);

    await button.focus();
    assert.equal(await hint.isVisible(), true);
    assert.equal((await hint.textContent())?.trim(), SYNC_MESSAGE);
    await page.screenshot({ path: path.join(artifactDir, 'tiro-livre-sync-foco.png') });
    await button.click({ force: true });
    assert.equal(((await page.getByTestId('freekick-clicks').textContent()) || '').trim(), '0');
    await page.close();
  });

  test('sync e poucas faltas ao mesmo tempo explicam o relógio', async () => {
    const page = await browser.newPage();
    await openMode(page, preview.url, 'both');
    const wrap = page.getByTestId('event-selector-freekick-wrap');
    assert.equal(await wrap.getAttribute('data-block-reason'), 'realtime');
    assert.equal(await wrap.getAttribute('title'), SYNC_MESSAGE);
    await page.close();
  });

  test('com 5 faltas e relógio liberado o clique registra', async () => {
    const page = await browser.newPage();
    await openMode(page, preview.url, 'enabled');
    const button = page.getByTestId('event-selector-freekick');
    assert.equal(await button.getAttribute('aria-disabled'), 'false');
    assert.equal(await page.getByTestId('tiro-livre-rule-hint').count(), 0);
    await button.click();
    assert.equal(((await page.getByTestId('freekick-clicks').textContent()) || '').trim(), '1');
    await page.close();
  });
});
