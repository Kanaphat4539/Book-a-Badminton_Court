const test = require('node:test');
const assert = require('node:assert/strict');
const { messages, translate } = require('./auth-news-messages.cjs');

test('Thai and English dictionaries have identical complete key sets', () => {
  assert.deepEqual(Object.keys(messages.th).sort(), Object.keys(messages.en).sort());
  assert.ok(Object.keys(messages.en).length > 25);
  for (const locale of ['th', 'en']) {
    for (const [key, value] of Object.entries(messages[locale])) {
      assert.equal(typeof value, 'string', `${locale}.${key} must be text`);
      assert.ok(value.trim(), `${locale}.${key} must not be empty`);
    }
  }
});

test('all route translation references are present in both dictionaries', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const routes = ['login/page.tsx', 'register/page.tsx', 'news/page.tsx'];
  const used = new Set();
  for (const route of routes) {
    const source = fs.readFileSync(path.resolve(__dirname, '../app', route), 'utf8');
    for (const match of source.matchAll(/(?:text|authNewsText)\('([^']+)'/g)) used.add(match[1]);
  }
  assert.ok(used.size >= 25);
  for (const key of used) {
    assert.ok(Object.hasOwn(messages.en, key), `missing en.${key}`);
    assert.ok(Object.hasOwn(messages.th, key), `missing th.${key}`);
  }
});

test('translate returns localized copy and preserves unknown server messages', () => {
  assert.equal(translate('loginFailed', 'th'), messages.th.loginFailed);
  assert.equal(translate('loginFailed', 'en'), messages.en.loginFailed);
  assert.equal(translate('Invalid login credentials', 'th'), 'Invalid login credentials');
});

test('required route copy keys cover auth and news content', () => {
  for (const key of ['usernameLabel', 'passwordLabel', 'loginFailed', 'registerSuccess', 'studentIdLabel', 'nameLabel', 'credentialHeading', 'loginPrompt', 'newsHeading', 'newsTermsBody', 'newsStatsBody', 'courtBooking', 'dashboardUpdate']) {
    assert.ok(Object.hasOwn(messages.en, key), `missing ${key}`);
  }
});
