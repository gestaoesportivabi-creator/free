#!/usr/bin/env node
/**
 * Gera `public/sitemap.xml` a partir dos posts multilingues.
 *
 * Roda no build do Vite (vercel) — ver package.json:scripts.build.
 * É intencionalmente independente do bundler; lê os .ts como texto e extrai
 * slugs via regex simples (posts são estáticos e controlados).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ORIGIN = 'https://scout21.vercel.app';

/** Extrai { slug, date, translations } de um arquivo posts.XX.ts simples. */
function parsePosts(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const blocks = raw.split(/\{\s*\n\s*slug:/g).slice(1);
  return blocks
    .map((block) => {
      const slugMatch = block.match(/^\s*['"]([^'"]+)['"]/);
      const dateMatch = block.match(/date:\s*['"]([0-9-]+)['"]/);
      if (!slugMatch || !dateMatch) return null;
      return { slug: slugMatch[1], date: dateMatch[1] };
    })
    .filter(Boolean);
}

const files = [
  { lang: 'pt-BR', path: resolve(ROOT, 'blog/posts.pt.ts'), prefix: '/blog' },
  { lang: 'en', path: resolve(ROOT, 'blog/posts.en.ts'), prefix: '/blog/en' },
  { lang: 'es', path: resolve(ROOT, 'blog/posts.es.ts'), prefix: '/blog/es' },
];

const staticUrls = [
  { loc: `${ORIGIN}/`, changefreq: 'weekly', priority: '1.0' },
  { loc: `${ORIGIN}/blog`, changefreq: 'daily', priority: '0.8' },
  { loc: `${ORIGIN}/blog/en`, changefreq: 'daily', priority: '0.7' },
  { loc: `${ORIGIN}/blog/es`, changefreq: 'daily', priority: '0.7' },
];

const today = new Date().toISOString().slice(0, 10);
const urls = [...staticUrls.map((u) => ({ ...u, lastmod: today }))];

for (const f of files) {
  try {
    const posts = parsePosts(f.path);
    for (const p of posts) {
      urls.push({
        loc: `${ORIGIN}${f.prefix}/${p.slug}`,
        lastmod: p.date,
        changefreq: 'monthly',
        priority: '0.6',
      });
    }
  } catch (err) {
    console.warn(`[sitemap] skip ${f.path}: ${err.message}`);
  }
}

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
    )
    .join('\n') +
  `\n</urlset>\n`;

const out = resolve(ROOT, 'public/sitemap.xml');
writeFileSync(out, xml);
console.log(`[sitemap] wrote ${urls.length} urls -> ${out}`);
