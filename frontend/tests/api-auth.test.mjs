import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { AxiosError } from 'axios';
import api from '../src/lib/api.ts';
import * as apiModule from '../src/lib/api.ts';

let values;
let redirects;
beforeEach(() => {
  values = new Map([['token', 'old-token'], ['user', '{"role":"STUDENT"}']]);
  redirects = [];
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: key => values.get(key) ?? null,
      removeItem: key => values.delete(key),
    },
  });
  globalThis.window = { location: { pathname: '/dashboard', replace: url => redirects.push(url) } };
});
afterEach(() => {
  delete globalThis.window;
  delete globalThis.localStorage;
});

function rejectWith(status, beforeResponse = () => {}) {
  return async config => {
    assert.equal(config.headers.Authorization, 'Bearer old-token');
    beforeResponse();
    throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, {
      status, statusText: 'Error', data: { message: 'Unauthorized' }, headers: {}, config,
    });
  };
}

test('protected 401 clears the rejected session and redirects to login', async () => {
  let rejected;
  await assert.rejects(api.get('/bookings/me', { adapter: rejectWith(401) }), error => {
    rejected = error;
    return true;
  });
  assert.equal(values.has('token'), false);
  assert.equal(values.has('user'), false);
  assert.deepEqual(redirects, ['/login']);
  assert.equal(apiModule.isSessionExpiredError(rejected), true);
});

test('concurrent unauthorized requests redirect only once', async () => {
  await Promise.allSettled([
    api.get('/bookings/me', { adapter: rejectWith(401) }),
    api.get('/users/me/ban-status', { adapter: rejectWith(401) }),
  ]);
  assert.deepEqual(redirects, ['/login']);
});

test('invalid login credentials remain available to the login form', async () => {
  await assert.rejects(api.post('/auth/login', {}, { adapter: rejectWith(401) }),
    error => error.response.data.message === 'Unauthorized');
  assert.equal(values.get('token'), 'old-token');
  assert.deepEqual(redirects, []);
});

test('forbidden and server errors do not log the user out', async () => {
  for (const status of [403, 500]) {
    await assert.rejects(api.get('/bookings', { adapter: rejectWith(status) }));
    assert.equal(values.get('token'), 'old-token');
    assert.deepEqual(redirects, []);
  }
});

test('a late 401 from an old request cannot erase a newly signed-in session', async () => {
  await assert.rejects(api.get('/bookings/me', {
    adapter: rejectWith(401, () => values.set('token', 'new-token')),
  }));
  assert.equal(values.get('token'), 'new-token');
  assert.equal(values.has('user'), true);
  assert.deepEqual(redirects, []);
});
