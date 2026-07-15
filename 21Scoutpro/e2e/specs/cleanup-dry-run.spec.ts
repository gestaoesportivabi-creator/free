import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../backend');

test('cleanup QA executa apenas em dry-run', async () => {
  const output = execFileSync(
    'cmd.exe',
    ['/c', 'npm run cleanup:qa-environment -- --dry-run'],
    {
      cwd: backendDir,
      encoding: 'utf-8',
      env: {
        ...process.env,
        ALLOW_QA_CLEANUP: 'true',
        QA_CLEANUP_CONFIRM: 'DELETE_QA_ENVIRONMENT',
      },
    }
  );

  expect(output).toContain('Dry-run concluido');
  expect(output).toContain('- total:');
  expect(output).not.toMatch(/Conflito de seguranca|Falha:/);
});
