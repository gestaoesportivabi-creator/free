import test from 'node:test';
import assert from 'node:assert/strict';
import {
  performFinalizeNavigation,
  sessionTokenAfterProfileFailure,
} from './sessionRestore.ts';

const TOKEN = 'session-token';

test('401 limpa o token', () => {
  assert.equal(
    sessionTokenAfterProfileFailure(TOKEN, { type: 'http', status: 401 }),
    null
  );
});

test('401 depois do unmount não limpa o token', () => {
  assert.equal(
    sessionTokenAfterProfileFailure(TOKEN, { type: 'http', status: 401 }, { cancelled: true }),
    TOKEN
  );
});

test('500 e erro de rede mantêm a sessão', () => {
  assert.equal(
    sessionTokenAfterProfileFailure(TOKEN, { type: 'http', status: 500 }),
    TOKEN
  );
  assert.equal(
    sessionTokenAfterProfileFailure(TOKEN, { type: 'http', status: 503 }),
    TOKEN
  );
  assert.equal(
    sessionTokenAfterProfileFailure(TOKEN, { type: 'network' }),
    TOKEN
  );
  assert.equal(
    sessionTokenAfterProfileFailure(TOKEN, { type: 'abort' }),
    TOKEN
  );
  assert.equal(
    sessionTokenAfterProfileFailure(TOKEN, { type: 'http', status: 403 }),
    TOKEN
  );
});

test('Finalizar navega sem reload e continua logado', () => {
  let token = TOKEN;
  let pushed = null;
  let assigned = null;
  let routed = 0;

  const kind = performFinalizeNavigation({
    hasLiveOpener: false,
    pushState: (url) => {
      pushed = url;
    },
    assign: (url) => {
      assigned = url;
      token = null;
    },
    close: () => {},
    softRoute: () => {
      routed += 1;
      pushed = '/dashboard';
    },
  });

  assert.equal(kind, 'soft');
  assert.equal(routed, 1);
  assert.equal(pushed, '/dashboard');
  assert.equal(assigned, null);
  assert.equal(token, TOKEN);
  assert.equal(
    sessionTokenAfterProfileFailure(token, { type: 'network' }),
    TOKEN
  );
});
