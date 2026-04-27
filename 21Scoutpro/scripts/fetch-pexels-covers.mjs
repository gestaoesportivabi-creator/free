#!/usr/bin/env node
/**
 * Busca capas de alta qualidade no Pexels (landscape) para cada post do blog.
 * - Requer PEXELS_API_KEY no env.
 * - Cada post tem uma lista de queries (primeira que retornar resultado relevante é usada).
 * - Grava em public/blog-covers/<slug>.jpg na variante `landscape` (1200x627 já otimizada pelo CDN).
 * - Gera/atualiza blog-covers-credits.json com crédito do fotógrafo para a página /blog (licença Pexels).
 * - Reexecutável: pode forçar com --force.
 */
import fs from 'node:fs';
import path from 'node:path';

const KEY = process.env.PEXELS_API_KEY;
if (!KEY) {
  console.error('Missing PEXELS_API_KEY env var.');
  process.exit(1);
}

const FORCE = process.argv.includes('--force');

// slug -> lista de queries priorizadas (PT ou EN).
// Observacao: quanto mais especifico, melhor; com fallback mais amplo.
const POSTS = [
  {
    slug: 'por-que-dados-no-banco-importam-mais-que-no-papel',
    queries: [
      'soccer analytics dashboard',
      'sports data analysis laptop',
      'coach analyzing tablet football',
    ],
  },
  {
    slug: 'rotina-de-semana-competitiva-com-elenco-apertado',
    queries: [
      'futsal training session',
      'soccer team training indoor',
      'football coach tactical board',
    ],
  },
  {
    slug: 'scout-alem-dos-numeros-contexto-para-o-treinador',
    queries: [
      'football coach clipboard players',
      'soccer coach talking to team',
      'futsal coach court',
    ],
  },
  {
    slug: 'indicadores-de-alta-performance-para-clubes-de-futsal',
    queries: [
      'sports performance monitoring gps',
      'athlete performance data',
      'sports science training',
    ],
  },
  {
    slug: 'como-montar-um-scout-individual-em-10-passos',
    queries: [
      'soccer player individual training',
      'football athlete close up',
      'futsal player dribbling',
    ],
  },
  {
    slug: 'gestao-de-equipe-no-futsal-como-parar-de-gerir-no-grupo',
    queries: [
      'futsal team huddle',
      'indoor soccer team group',
      'soccer team locker room',
    ],
  },
  {
    slug: 'programacao-semanal-de-treinos-e-jogos-sem-whatsapp',
    queries: [
      'calendar planning office',
      'sports schedule tablet',
      'coach planning notebook',
    ],
  },
  {
    slug: 'relatorio-gerencial-no-futsal-o-que-a-presidencia-precisa-ver',
    queries: [
      'business report meeting charts',
      'executive dashboard presentation',
      'sports management meeting',
    ],
  },
  {
    slug: 'monitoramento-fisiologico-no-futsal-com-pse-psr-e-bem-estar',
    queries: [
      'athlete heart rate monitor training',
      'sports wellness recovery',
      'player stretching recovery',
    ],
  },
  {
    slug: 'seo-local-para-clubes-de-futsal-como-ser-encontrado-no-google',
    queries: [
      'local business google maps',
      'computer screen showing google maps',
      'person using laptop for local search',
    ],
  },
  {
    slug: 'seo-tecnico-para-sites-de-clubes-de-futsal-como-melhorar-performance-e-indexacao',
    queries: [
      'website optimization',
      'technical SEO audit',
      'website performance improvement',
    ],
  },
  {
    slug: 'ciclo-de-feedback-scout-treino-72h-futsal',
    queries: [
      'coach feedback session',
      'sports training feedback',
      'performance review meeting',
    ],
  },
];

const OUT_DIR = path.resolve('public/blog-covers');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function searchPexels(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape&size=large`;
  const res = await fetch(url, { headers: { Authorization: KEY } });
  if (!res.ok) throw new Error(`pexels ${res.status}`);
  const data = await res.json();
  return data.photos || [];
}

async function downloadTo(filePath, url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filePath, buf);
  return buf.length;
}

function bestLandscape(photo) {
  // Monta URL grande a partir do `original` para garantir 1600x900 nítido em hero.
  const original = photo?.src?.original;
  if (original) {
    return `${original}?auto=compress&cs=tinysrgb&fit=crop&w=1600&h=900`;
  }
  return photo?.src?.landscape || photo?.src?.large2x || photo?.src?.large;
}

const credits = {};

for (const post of POSTS) {
  const outPath = path.join(OUT_DIR, `${post.slug}.jpg`);
  if (!FORCE && fs.existsSync(outPath) && fs.statSync(outPath).size > 100_000) {
    // se já tiver >100kb e não for forçado, mantém
  }
  let chosen;
  let usedQuery;
  for (const q of post.queries) {
    try {
      const photos = await searchPexels(q);
      if (photos.length > 0) {
        chosen = photos[0];
        usedQuery = q;
        break;
      }
    } catch (err) {
      console.error('search fail', post.slug, q, err.message);
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  if (!chosen) {
    console.error('no photo for', post.slug);
    continue;
  }
  const url = bestLandscape(chosen);
  const bytes = await downloadTo(outPath, url);
  credits[post.slug] = {
    query: usedQuery,
    photographer: chosen.photographer,
    photographer_url: chosen.photographer_url,
    photo_url: chosen.url,
    source: 'Pexels',
    bytes,
  };
  console.log(`ok ${post.slug} <- "${usedQuery}" by ${chosen.photographer} (${bytes} bytes)`);
  await new Promise((r) => setTimeout(r, 500));
}

const creditsPath = path.resolve('public/blog-covers-credits.json');
fs.writeFileSync(creditsPath, JSON.stringify(credits, null, 2));
console.log('wrote credits ->', creditsPath);
