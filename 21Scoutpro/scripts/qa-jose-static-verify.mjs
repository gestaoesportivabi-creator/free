#!/usr/bin/env node
/**
 * Verificação estática pós-fix do relatório QA José.
 * Não substitui e2e/load test — falha se strings/wiring críticos sumirem.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const checks = [
  ['Sidebar Agenda', '21Scoutpro/components/Sidebar.tsx', 'Agenda de treinos'],
  ['CTA scout', '21Scoutpro/components/Schedule.tsx', 'Criar partida para scout'],
  ['Faltas do tempo', '21Scoutpro/components/MatchScoutingWindow.tsx', 'Faltas do tempo'],
  ['Tiro livre tooltip', '21Scoutpro/components/MatchScoutingWindow.tsx', 'Disponível após 5 faltas'],
  ['Tiro livre overlay', '21Scoutpro/components/MatchScoutingWindow.tsx', 'tiro-livre-disabled-overlay'],
  ['Tiro livre hint', '21Scoutpro/components/MatchScoutingWindow.tsx', 'tiro-livre-rule-hint'],
  ['Finalize modal', '21Scoutpro/components/MatchScoutingWindow.tsx', 'finalize-collection-confirm'],
  ['Selecionar padrão', '21Scoutpro/components/MatchScoutingWindow.tsx', 'lineup-select-default'],
  ['CTA reingresso incompleta', '21Scoutpro/components/MatchScoutingWindow.tsx', 'BUG-CTA-PADRAO-REINGRESSO'],
  ['Handoff análise', '21Scoutpro/utils/openMatchAnalysis.ts', 'OPEN_MATCH_ANALYSIS_KEY'],
  ['Keep session finalize', '21Scoutpro/utils/openMatchAnalysis.ts', 'KEEP_SESSION_AFTER_FINALIZE_KEY'],
  ['Infer clock from tape', '21Scoutpro/components/MatchScoutingWindow.tsx', 'inferClockFromMatchEvents'],
  ['Persist clock always', '21Scoutpro/components/MatchScoutingWindow.tsx', 'Always persist clock into lineup'],
  ['Light autosave signature', '21Scoutpro/components/MatchScoutingWindow.tsx', 'Assinatura leve'],
  ['Auth keep token grace', '21Scoutpro/App.tsx', 'Grace pós-Finalizar'],
];

let failed = 0;
for (const [name, rel, needle] of checks) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error(`FAIL ${name}: missing ${rel}`);
    failed++;
    continue;
  }
  const text = fs.readFileSync(full, 'utf8');
  if (!text.includes(needle)) {
    console.error(`FAIL ${name}: missing «${needle.slice(0, 60)}…» in ${rel}`);
    failed++;
  } else {
    console.log(`OK   ${name}`);
  }
}

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll static QA José checks passed.');
