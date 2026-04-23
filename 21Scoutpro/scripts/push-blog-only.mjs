#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import path from 'node:path';

const DEFAULT_MESSAGE = 'content(blog): publicar atualizacoes do blog';
const PROJECT_PREFIX = `${path.basename(process.cwd())}/`;
const ALLOWLIST = [
  'blog/',
  'components/BlogPage.tsx',
  'public/sitemap.xml',
  'public/blog-covers/',
  'public/blog-covers-credits.json',
  'dist/index.html',
  'scripts/build-sitemap.mjs',
  'scripts/push-blog-only.mjs',
  'scripts/gen-blog-covers.mjs',
  'scripts/link-cover-images.mjs',
  'scripts/fetch-pexels-covers.mjs',
];

function git(args, options = {}) {
  const result = execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    ...options,
  });
  return typeof result === 'string' ? result.trim() : '';
}

function npm(args, options = {}) {
  return execFileSync('npm', args, {
    encoding: 'utf8',
    stdio: 'inherit',
    ...options,
  });
}

function isAllowed(path) {
  const normalized = path.startsWith(PROJECT_PREFIX) ? path.slice(PROJECT_PREFIX.length) : path;
  return ALLOWLIST.some((entry) => (entry.endsWith('/') ? normalized.startsWith(entry) : normalized === entry));
}

function parseArgs(argv) {
  const out = {
    dryRun: false,
    noPush: false,
    skipBuild: false,
    message: DEFAULT_MESSAGE,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') out.dryRun = true;
    else if (arg === '--no-push') out.noPush = true;
    else if (arg === '--skip-build') out.skipBuild = true;
    else if (arg === '--message' && argv[i + 1]) {
      out.message = argv[i + 1];
      i += 1;
    }
  }

  return out;
}

function workingTreeFiles() {
  const raw = git(['ls-files', '--modified', '--others', '--exclude-standard']);
  if (!raw) return [];
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function stagedFiles() {
  const raw = git(['diff', '--cached', '--name-only']);
  return raw ? raw.split('\n').map((line) => line.trim()).filter(Boolean) : [];
}

function ensureNoStagedOutsideAllowlist() {
  const staged = stagedFiles();
  const outside = staged.filter((file) => !isAllowed(file));
  if (outside.length > 0) {
    throw new Error(
      `Existem arquivos staged fora do escopo do blog: ${outside.join(', ')}. ` +
        'Desfaça o stage desses arquivos antes de usar este script.',
    );
  }
}

function stageAllowedChanges() {
  const changed = workingTreeFiles();
  const allowed = changed.filter(isAllowed);
  if (allowed.length === 0) return [];
  const forced = allowed.filter((file) => file === 'dist/index.html');
  const normal = allowed.filter((file) => file !== 'dist/index.html');
  if (normal.length > 0) git(['add', '--', ...normal]);
  if (forced.length > 0) git(['add', '-f', '--', ...forced]);
  return allowed;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  ensureNoStagedOutsideAllowlist();

  if (!args.skipBuild) {
    npm(['run', 'build']);
  }

  stageAllowedChanges();
  const finalStaged = stagedFiles().filter(isAllowed);

  if (finalStaged.length === 0) {
    console.log('Nenhuma mudanca de blog para publicar.');
    return;
  }

  console.log('Arquivos do blog prontos para publicar:');
  for (const file of finalStaged) console.log(`- ${file}`);

  if (args.dryRun) {
    console.log('Dry-run: commit/push nao executados.');
    return;
  }

  git([
    'commit',
    '-m',
    `${args.message}\n\nCo-Authored-By: Paperclip <noreply@paperclip.ing>`,
  ], { stdio: 'inherit' });

  if (args.noPush) {
    console.log('Commit criado; push pulado por --no-push.');
    return;
  }

  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  git(['push', 'origin', branch], { stdio: 'inherit' });
  console.log(`Push concluido em origin/${branch}. (Deploy Vercel: integracao GitHub ao receber o push.)`);
}

main();
