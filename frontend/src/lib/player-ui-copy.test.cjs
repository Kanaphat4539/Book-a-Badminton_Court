const test = require('node:test');
const assert = require('node:assert/strict');
const { playerUiCopy } = require('./player-ui-copy.cjs');

test('player UI copy exposes the same keys in Thai and English', () => {
  const thai = Object.keys(playerUiCopy.th).sort();
  const english = Object.keys(playerUiCopy.en).sort();
  assert.deepEqual(thai, english);
  assert.ok(thai.length >= 12);
});

test('every player UI string is translated and non-empty', () => {
  for (const key of Object.keys(playerUiCopy.en)) {
    const value = playerUiCopy.en[key];
    assert.equal(typeof value, 'string');
    assert.ok(value.trim().length > 0, `${key} is empty`);
    assert.ok(playerUiCopy.th[key].trim().length > 0, `${key} Thai is empty`);
    assert.notEqual(value, playerUiCopy.th[key], `${key} was not translated to Thai`);
  }
});

test('English player UI copy contains no Thai characters', () => {
  const thaiRange = /[\u0E00-\u0E7F]/;
  for (const [key, value] of Object.entries(playerUiCopy.en)) {
    assert.ok(!thaiRange.test(value), `${key} leaks Thai into the English build`);
  }
});

test('Thai player UI copy keeps the brand-free labels translated', () => {
  const thaiRange = /[\u0E00-\u0E7F]/;
  for (const key of ['banTitle', 'banBody', 'banAcknowledge', 'loadingDetail', 'loadingTitle', 'dialogCloseLabel']) {
    assert.ok(thaiRange.test(playerUiCopy.th[key]), `${key} is still English in the Thai build`);
  }
});
