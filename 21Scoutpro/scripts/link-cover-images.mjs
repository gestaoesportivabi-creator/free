#!/usr/bin/env node
/**
 * Liga cada post PT ao coverImage + coverCredit baseados em:
 *   - arquivo public/blog-covers/<slug>.jpg
 *   - public/blog-covers-credits.json (gerado pelo fetch-pexels-covers.mjs)
 * Idempotente: atualiza entradas existentes.
 */
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.resolve('blog/posts.pt.ts');
const CREDITS = path.resolve('public/blog-covers-credits.json');
let credits = {};
if (fs.existsSync(CREDITS)) {
  try {
    credits = JSON.parse(fs.readFileSync(CREDITS, 'utf8'));
  } catch {
    credits = {};
  }
}

let src = fs.readFileSync(FILE, 'utf8');

const escapeForRegex = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

function buildInjection(slug) {
  const coverRel = `/blog-covers/${slug}.jpg`;
  const abs = path.resolve('public', `blog-covers/${slug}.jpg`);
  if (!fs.existsSync(abs)) return null;
  const c = credits[slug];
  const lines = [`    coverImage: '${coverRel}',`];
  if (c && c.photographer) {
    const photographer = c.photographer.replace(/'/g, "\\'");
    const photographerUrl = (c.photographer_url || '').replace(/'/g, "\\'");
    const photoUrl = (c.photo_url || '').replace(/'/g, "\\'");
    const source = (c.source || 'Pexels').replace(/'/g, "\\'");
    lines.push(`    coverCredit: {`);
    lines.push(`      source: '${source}',`);
    lines.push(`      photographer: '${photographer}',`);
    if (photographerUrl) lines.push(`      photographerUrl: '${photographerUrl}',`);
    if (photoUrl) lines.push(`      photoUrl: '${photoUrl}',`);
    lines.push(`    },`);
  }
  return lines.join('\n') + '\n';
}

const slugs = [...src.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);
let changed = 0;

for (const slug of slugs) {
  const injection = buildInjection(slug);
  if (!injection) {
    console.warn('skip (no image):', slug);
    continue;
  }

  // Remove bloco anterior de coverImage/coverCredit se existir.
  const postRegex = new RegExp(
    `(slug:\\s*'${escapeForRegex(slug)}'[\\s\\S]*?)(^  \\},)`,
    'm',
  );
  const m = src.match(postRegex);
  if (!m) {
    console.warn('not found:', slug);
    continue;
  }

  let body = m[1];
  body = body.replace(/^\s*coverImage:\s*'[^']*',\n/m, '');
  body = body.replace(/^\s*coverCredit:\s*\{[\s\S]*?\n\s*\},\n/m, '');

  const updated = body + injection;
  src = src.slice(0, m.index) + updated + m[2] + src.slice(m.index + m[0].length);
  changed += 1;
  console.log('linked:', slug);
}

fs.writeFileSync(FILE, src);
console.log(`done. changed=${changed}`);
