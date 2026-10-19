import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ApiRequestError,
  PLANS_CTA_HREF,
  PLANS_CTA_LABEL,
  isTrialExpiredSaveError,
  notifyTrialExpiredMatchSave,
  trialExpiredMatchSaveMessage,
} from './trialExpiredSave.ts';

test('402 + trial_expired identifica teste ou assinatura expirada', () => {
  const expired = new ApiRequestError(402, 'trial_expired', 'Seu teste de 30 dias terminou.');
  assert.equal(isTrialExpiredSaveError(expired), true);
  assert.equal(isTrialExpiredSaveError(new ApiRequestError(500, 'trial_expired')), false);
  assert.equal(isTrialExpiredSaveError(new ApiRequestError(402, 'email_not_verified')), false);
  assert.equal(isTrialExpiredSaveError(new Error('trial_expired')), false);
});

test('mensagem diz que o teste terminou e que os dados continuam na tela', () => {
  const text = trialExpiredMatchSaveMessage(true);
  assert.match(text, /período de teste terminou/);
  assert.match(text, /não foram perdidos/);
  assert.match(text, /continuam nesta tela/);
});

test('não afirma que os dados continuam quando o fluxo os descarta', () => {
  const text = trialExpiredMatchSaveMessage(false);
  assert.match(text, /período de teste terminou/);
  assert.doesNotMatch(text, /não foram perdidos/);
});

test('CTA abre os planos só quando a pessoa confirma', () => {
  let opened = null;
  notifyTrialExpiredMatchSave(true, {
    confirm: (message) => {
      assert.match(message, /período de teste terminou/);
      assert.match(message, /não foram perdidos/);
      assert.match(message, /ver os planos/i);
      return true;
    },
    open: (url) => {
      opened = url;
    },
  });
  assert.equal(opened, PLANS_CTA_HREF);
  assert.equal(PLANS_CTA_LABEL, 'Ver planos');

  notifyTrialExpiredMatchSave(true, {
    confirm: () => false,
    open: () => {
      throw new Error('não deveria abrir os planos');
    },
  });
});
