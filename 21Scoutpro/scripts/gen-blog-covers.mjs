#!/usr/bin/env node
/**
 * Gera capas do blog via provedor de imagem gratuito (Pollinations, sem key).
 * - Ignora posts que já tem imagem (idempotente).
 * - Retry com fallback model.
 * - Paraleliza até 3 requisições.
 */
import fs from 'node:fs';
import path from 'node:path';

const POSTS = [
  ['por-que-dados-no-banco-importam-mais-que-no-papel',
    'futsal coaching staff analyzing performance dashboard on laptops in indoor arena, cinematic teal and cyan neon lighting, professional sports analytics, ultra detailed, no text'],
  ['rotina-de-semana-competitiva-com-elenco-apertado',
    'futsal weekly planning board with training cones and tactical clipboard, coaching team collaborating, modern sports operations, dramatic lighting, no text'],
  ['scout-alem-dos-numeros-contexto-para-o-treinador',
    'futsal coach discussing tactical context with analysts beside digital match data screen, realistic sports scene, high detail, no text'],
  ['indicadores-de-alta-performance-para-clubes-de-futsal',
    'high performance futsal metrics concept with wearable data and tactical dashboard, elite training environment, photorealistic, no text'],
  ['como-montar-um-scout-individual-em-10-passos',
    'individual futsal player analysis session with heatmap and notes on tablet, coach mentoring athlete, detailed, no text'],
  ['gestao-de-equipe-no-futsal-como-parar-de-gerir-no-grupo',
    'organized futsal team management workspace with roster board and digital planning tools, professional club office, no text'],
  ['programacao-semanal-de-treinos-e-jogos-sem-whatsapp',
    'weekly futsal schedule on large digital calendar with drills and match blocks, coaching room, clean composition, no text'],
  ['relatorio-gerencial-no-futsal-o-que-a-presidencia-precisa-ver',
    'executive sports report presentation in futsal club boardroom with key charts and strategic insights, realistic, no text'],
  ['monitoramento-fisiologico-no-futsal-com-pse-psr-e-bem-estar',
    'futsal physiological monitoring concept with wellness metrics and heart rate tracking during training, cinematic, no text'],
];

const OUT_DIR = path.resolve(process.cwd(), 'public/blog-covers');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TIMEOUT_MS = 120_000;
const MAX_PARALLEL = 1;
const DELAY_BETWEEN_MS = 6_000;

async function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(id);
  }
}

async function generate(slug, prompt) {
  const outPath = path.join(OUT_DIR, `${slug}.jpg`);
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 20_000) {
    return { slug, skipped: true, bytes: fs.statSync(outPath).size };
  }
  const models = ['flux', 'turbo', 'flux'];
  let lastErr;
  for (let i = 0; i < models.length; i += 1) {
    const model = models[i];
    try {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1600&height=900&nologo=true&model=${model}&seed=${21 + i}`;
      const buf = await fetchWithTimeout(url, TIMEOUT_MS);
      if (buf.length < 5_000) throw new Error(`too_small:${buf.length}`);
      fs.writeFileSync(outPath, buf);
      return { slug, bytes: buf.length, model };
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 8_000));
    }
  }
  throw new Error(`${slug}: ${lastErr?.message || 'fail'}`);
}

async function runPool(items, worker, n = MAX_PARALLEL) {
  const queue = [...items];
  const results = [];
  async function next() {
    while (queue.length) {
      const item = queue.shift();
      try {
        const r = await worker(item);
        results.push(r);
        console.log('ok', r);
      } catch (e) {
        console.error('fail', e.message);
        results.push({ error: e.message });
      }
      if (queue.length) await new Promise((r) => setTimeout(r, DELAY_BETWEEN_MS));
    }
  }
  await Promise.all(Array.from({ length: n }, next));
  return results;
}

await runPool(POSTS, ([slug, prompt]) => generate(slug, prompt));
console.log('done.');
