import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Subscription } from '@prisma/client';
import { isEmailVerificationOverdue } from '../src/utils/subscription.helper';

function sub(partial: Partial<Subscription> & Pick<Subscription, 'status'>): Subscription {
  const createdAt = partial.createdAt ?? new Date('2026-08-06T15:54:09.544Z');
  return {
    id: 'sub-1',
    userId: 'user-1',
    plan: 'ESSENCIAL',
    trialStartedAt: null,
    trialEndsAt: null,
    currentPeriodEnd: null,
    canceledAt: null,
    provider: null,
    providerCustomerId: null,
    providerSubscriptionId: null,
    createdAt,
    updatedAt: createdAt,
    ...partial,
  } as Subscription;
}

describe('isEmailVerificationOverdue', () => {
  const now = new Date('2026-11-26T23:00:00.000Z');

  it('não bloqueia assinatura active mesmo sem e-mail verificado (Bruno / legado)', () => {
    const overdue = isEmailVerificationOverdue(
      { roleName: 'ESSENCIAL', email: 'menegattb@gmail.com', emailVerifiedAt: null },
      sub({ status: 'active', createdAt: new Date('2026-08-06T15:54:09.544Z') }),
      now
    );
    assert.equal(overdue, false);
  });

  it('bloqueia trial após a graça de 7 dias sem verificar e-mail', () => {
    const overdue = isEmailVerificationOverdue(
      { roleName: 'ESSENCIAL', email: 'joao@example.com', emailVerifiedAt: null },
      sub({
        status: 'trialing',
        plan: 'PERFORMANCE',
        trialStartedAt: new Date('2026-11-10T14:29:32.092Z'),
        createdAt: new Date('2026-11-10T14:29:32.092Z'),
      }),
      now
    );
    assert.equal(overdue, true);
  });

  it('não bloqueia trial ainda dentro da graça', () => {
    const overdue = isEmailVerificationOverdue(
      { roleName: 'ESSENCIAL', email: 'novo@example.com', emailVerifiedAt: null },
      sub({
        status: 'trialing',
        plan: 'PERFORMANCE',
        trialStartedAt: new Date('2026-11-24T12:00:00.000Z'),
        createdAt: new Date('2026-11-24T12:00:00.000Z'),
      }),
      now
    );
    assert.equal(overdue, false);
  });

  it('não bloqueia quando o e-mail já foi verificado', () => {
    const overdue = isEmailVerificationOverdue(
      {
        roleName: 'ESSENCIAL',
        email: 'ok@example.com',
        emailVerifiedAt: new Date('2026-11-11T00:00:00.000Z'),
      },
      sub({
        status: 'trialing',
        trialStartedAt: new Date('2026-11-01T00:00:00.000Z'),
      }),
      now
    );
    assert.equal(overdue, false);
  });
});
