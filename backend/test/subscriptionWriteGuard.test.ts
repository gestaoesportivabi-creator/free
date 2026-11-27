import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('requireActiveSubscription', () => {
  it('não corta escrita com 403 email_not_verified (banner-only)', () => {
    const src = readFileSync(
      join(process.cwd(), 'src/middleware/subscription.middleware.ts'),
      'utf8'
    );
    assert.match(src, /isExpired/);
    assert.doesNotMatch(src, /email_not_verified/);
    assert.doesNotMatch(src, /emailVerificationOverdue\)/);
  });
});
