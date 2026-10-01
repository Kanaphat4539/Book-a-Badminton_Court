import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createLoadingController } from '../src/lib/loading-controller.ts';

test('refresh waits for readiness, minimum display time, and outstanding data', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const loading = createLoadingController();
  loading.start();
  const release = loading.track();
  loading.ready('/dashboard');
  t.mock.timers.tick(800);
  assert.equal(loading.getSnapshot(), true);
  release();
  t.mock.timers.tick(100);
  assert.equal(loading.getSnapshot(), false);
  loading.dispose();
});

test('authentication transition waits for the destination and can repeat', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const loading = createLoadingController();
  for (const source of ['/login', '/register']) {
    loading.start(source);
    loading.ready(source);
    t.mock.timers.tick(1000);
    assert.equal(loading.getSnapshot(), true);
    loading.ready('/dashboard');
    t.mock.timers.tick(100);
    assert.equal(loading.getSnapshot(), false);
  }
  loading.dispose();
});

test('background polling does not reopen loading; failed requests can release it', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const loading = createLoadingController();
  loading.start();
  const release = loading.track();
  loading.ready('/');
  release();
  release();
  t.mock.timers.tick(900);
  assert.equal(loading.getSnapshot(), false);
  loading.track()();
  assert.equal(loading.getSnapshot(), false);
  loading.dispose();
});

test('a stalled request cannot trap the user behind the overlay', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const loading = createLoadingController();
  loading.start();
  const staleRelease = loading.track();
  t.mock.timers.tick(15000);
  assert.equal(loading.getSnapshot(), false);
  loading.start('/login');
  const release = loading.track();
  staleRelease();
  loading.ready('/dashboard');
  t.mock.timers.tick(900);
  assert.equal(loading.getSnapshot(), true);
  release();
  t.mock.timers.tick(100);
  assert.equal(loading.getSnapshot(), false);
  loading.dispose();
});
