/**
 * Captura as imagens de produto usadas na landing page.
 *
 * Usa a conta de vitrine populada com o seed de demonstração (dados fictícios),
 * portanto nenhuma imagem contém dado real de atleta — requisito de LGPD e
 * condição para publicar as capturas sem autorização de ninguém.
 *
 * Uso:
 *   VITRINE_EMAIL=... VITRINE_PASSWORD=... npx tsx scripts/capture-landing-shots.ts
 *
 * Pré-requisitos: backend em :3000, frontend em :5173, conta já com demo-data.
 */

import { chromium, type Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const EMAIL = process.env.VITRINE_EMAIL ?? 'bruno.demo@scout21.local';
const PASSWORD = process.env.VITRINE_PASSWORD ?? 'scout2026';
const OUT_DIR = path.join(process.cwd(), 'public', 'shots');

/** 2x para telas retina — a landing exibe com metade da largura. */
const VIEWPORT = { width: 1440, height: 900 };
const SCALE = 2;

async function settle(page: Page, ms = 1200) {
  await page.waitForTimeout(ms);
}

/**
 * Neutraliza o que polui uma captura de produto: popup de newsletter,
 * widget de WhatsApp e as animações de entrada por scroll.
 */
async function cleanChrome(page: Page) {
  await page.addStyleTag({
    content: `
      [class*="opacity-0"] { opacity: 1 !important; transform: none !important; }
      *, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }
      a[href*="wa.me"] { display: none !important; }
    `,
  });
}

/**
 * Autentica injetando o token direto no localStorage.
 *
 * Evita o formulário e, principalmente, o `location.assign('/dashboard')` do
 * PublicApp — cujo evento `load` só dispara depois de todo o carregamento de
 * dados, o que estoura qualquer `waitForURL` razoável.
 */
async function login(page: Page) {
  // VITRINE_TOKEN evita bater no rate-limit de login em execuções repetidas.
  let token = process.env.VITRINE_TOKEN ?? '';
  if (!token) {
    const res = await page.request.post('http://localhost:3000/api/auth/login', {
      data: { email: EMAIL, password: PASSWORD },
    });
    if (!res.ok()) throw new Error(`Login falhou: ${res.status()} — use VITRINE_TOKEN`);
    token = (await res.json()).data.token as string;
  }

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ([t]) => {
      localStorage.setItem('token', t);
      localStorage.setItem('scout21_newsletter_v1', 'dismissed');
    },
    [token]
  );

  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
}

/**
 * Espera o app ficar pronto.
 *
 * Aguarda um sinal POSITIVO (a navegação principal existir), não a ausência do
 * texto "Carregando" — `innerText` oscila para "" durante re-renders e produz
 * falso positivo. A sidebar é um `div[role="navigation"]`, não um `<aside>`.
 *
 * O timeout é largo porque, contra o pooler remoto do Supabase, o primeiro
 * carregamento (elenco + jogos + campeonatos) passa de 20s.
 */
async function waitReady(page: Page, readySelector = '[role="navigation"]') {
  await page.waitForSelector(readySelector, { timeout: 240_000 });
  await page.waitForFunction(
    () => !/Carregando/.test(document.querySelector('main')?.textContent ?? ''),
    { timeout: 120_000 }
  ).catch(() => undefined);
  await settle(page, 4000);
}

async function shoot(page: Page, name: string, clip?: { x: number; y: number; width: number; height: number }) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await cleanChrome(page);
  await page.screenshot({ path: file, clip, scale: 'device' });
  const kb = Math.round(fs.statSync(file).size / 1024);
  console.log(`  ✅ ${name}.png (${kb} kB)`);
}

/** Navega por uma aba da sidebar pelo rótulo visível. */
async function openTab(page: Page, label: string): Promise<boolean> {
  // A sidebar usa botões com texto; `getByText` é mais tolerante que role+name
  // porque vários itens embrulham ícone + label em spans separados.
  const item = page
    .locator('[role="navigation"] button, [role="navigation"] a')
    .filter({ hasText: new RegExp(label, 'i') })
    .first();
  try {
    await item.scrollIntoViewIfNeeded({ timeout: 5000 });
    await item.click({ timeout: 8000 });
    await waitReady(page);
    return true;
  } catch {
    console.log(`  ⏭️  aba "${label}" não encontrada`);
    return false;
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    locale: 'pt-BR',
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  console.log('🔐 Autenticando na conta de vitrine...');
  await login(page);

  console.log('📸 Capturando telas do produto:');

  // 1. Painel completo — visão geral com indicadores
  await shoot(page, 'dashboard');

  // 2. Scout coletivo — gráficos e comparativos
  if (await openTab(page, 'Scout Coletivo')) await shoot(page, 'scout-coletivo');

  // 3. Ranking do elenco
  if (await openTab(page, 'Ranking')) await shoot(page, 'ranking');

  // 4. Elenco
  if (await openTab(page, 'Elenco')) await shoot(page, 'elenco');

  // 5. Dados do jogo — lista de partidas
  if (await openTab(page, 'Dados do Jogo')) await shoot(page, 'dados-do-jogo');

  // 6. (Fisiologia fica de fora até haver seed de PSE/sono/bem-estar — sem esses
  //     dados a tela de prontidão/ACWR aparece vazia e não vende nada.)

  // 7. Assistente de IA — tela de entrada (full-screen, sem sidebar; espera o input).
  await page.goto(`${BASE}/dashboard/assistente`, { waitUntil: 'domcontentloaded' });
  await waitReady(page, 'textarea[placeholder*="Mensagem"]');
  await shoot(page, 'assistente');

  // 8. Coleta ao vivo — o shell Deck & Rail, em tablet paisagem (uso real na quadra).
  const tablet = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: SCALE,
    locale: 'pt-BR',
    colorScheme: 'dark',
  });
  const tabletPage = await tablet.newPage();
  await captureLiveCollection(tabletPage);

  await browser.close();
  console.log(`\n✅ Capturas em ${OUT_DIR}`);
}

/**
 * Captura o shell de coleta ao vivo.
 *
 * O shell só aparece depois da escalação: injeta o elenco de demonstração em
 * `realtimeScoutData`, abre a coleta, escala 5 atletas (1 goleiro + 4 de linha),
 * define a posse e inicia a partida. Tudo dados fictícios.
 */
async function captureLiveCollection(page: Page): Promise<void> {
  const token = process.env.VITRINE_TOKEN ?? '';
  const res = await page.request.get('http://localhost:3000/api/players', {
    headers: { Authorization: `Bearer ${token}`, Origin: BASE },
    timeout: 90_000, // o pooler do Supabase leva 15-20s por chamada localmente
  });
  if (!res.ok()) {
    console.log('  ⏭️  coleta ao vivo — não obtive o elenco');
    return;
  }
  const body = await res.json();
  const players = (body.data ?? body) as Array<{ id: string; position?: string }>;
  if (!Array.isArray(players) || players.length < 5) {
    console.log('  ⏭️  coleta ao vivo — elenco insuficiente');
    return;
  }

  // 1 goleiro + 4 de linha: o modal só aceita um goleiro em quadra.
  const gk = players.find((p) => p.position === 'Goleiro') ?? players[0];
  const line = players.filter((p) => p.id !== gk.id).slice(0, 4);
  const starters = [gk, ...line].map((p) => p.id);

  const scoutData = {
    date: new Date().toISOString().slice(0, 10),
    opponent: 'Adversário Demonstração',
    competition: 'Campeonato de Demonstração',
    players,
    teams: [],
    matchType: 'normal',
    extraTimeMinutes: 0,
    selectedPlayerIds: players.map((p) => p.id),
  };

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ([t, data]) => {
      localStorage.setItem('token', t as string);
      localStorage.setItem('scout21_newsletter_v1', 'dismissed');
      localStorage.setItem('realtimeScoutData', data as string);
    },
    [token, JSON.stringify(scoutData)] as const
  );

  await page.goto(`${BASE}/scout-realtime?coleta=shell`, { waitUntil: 'domcontentloaded' });

  // Escalação
  await page.waitForSelector('[data-testid="lineup-confirm-start"]', { timeout: 60_000 });
  for (const id of starters) {
    await page.locator(`[data-testid="lineup-player-option-${id}"]`).click({ timeout: 8000 }).catch(() => undefined);
    await settle(page, 250);
  }
  await page.locator('[data-testid="lineup-ball-us"]').click({ timeout: 8000 }).catch(() => undefined);
  await page.locator('[data-testid="lineup-confirm-start"]').click({ timeout: 8000 });

  // A escalação leva ao estado PRE-JOGO. Iniciar a partida (o cronômetro) liga
  // o registro de eventos e a interface de coleta ao vivo.
  await page.waitForSelector('[data-testid="clock-start"]', { timeout: 30_000 });
  await settle(page, 600);
  await page.locator('[data-testid="clock-start"]').click({ timeout: 8000 });

  // Partida rodando: aparece o botão de pausar o cronômetro e o seletor de atleta.
  const running = await page
    .waitForSelector('[data-testid="clock-pause"]', { timeout: 30_000 })
    .then(() => true)
    .catch(() => false);

  if (!running) {
    console.log('  ⏭️  coleta ao vivo — partida não entrou em execução');
    return;
  }
  // Seleciona um atleta para a tela ficar em contexto de registro (não vazia).
  await page.locator('[data-testid="player-selector"] button').first().click({ timeout: 6000 }).catch(() => undefined);
  await settle(page, 2500);
  await shoot(page, 'coleta-ao-vivo');
}

main().catch((error) => {
  console.error('❌ Falha na captura:', error);
  process.exit(1);
});
