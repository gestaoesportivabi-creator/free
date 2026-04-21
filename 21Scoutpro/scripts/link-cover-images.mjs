#!/usr/bin/env node
/**
 * Adiciona `coverImage` em cada post PT a partir de `public/blog-covers/<slug>.jpg`.
 * Idempotente: só insere se ainda não existir e se a imagem existir no disco.
 */
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.resolve('blog/posts.pt.ts');
const src = fs.readFileSync(FILE, 'utf8');

const slugs = [...src.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);
let out = src;
let changed = 0;

for (const slug of slugs) {
  const coverRel = `/blog-covers/${slug}.jpg`;
  const absCover = path.resolve('public', `blog-covers/${slug}.jpg`);
  if (!fs.existsSync(absCover)) {
    console.warn('skip (no image):', slug);
    continue;
  }

  const postRegex = new RegExp(
    `(slug:\\s*'${slug.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\\\$&')}'[\\s\\S]*?)(^  \\},)`,
    'm',
  );
  const match = out.match(postRegex);
  if (!match) {
    console.warn('not found in file:', slug);
    continue;
  }
  if (match[1].includes('coverImage:')) {
    console.log('already linked:', slug);
    continue;
  }
  const updated = match[1] + `    coverImage: '${coverRel}',\n`;
  out = out.slice(0, match.index) + updated + match[2] + out.slice(match.index + match[0].length);
  changed += 1;
  console.log('linked:', slug);
}

fs.writeFileSync(FILE, out);
console.log(`done. changed=${changed}`);
