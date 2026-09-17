import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';

test('compiled theme colors remain responsive to dark-mode variable overrides', async () => {
  const from = fileURLToPath(new URL('../src/app/globals.css', import.meta.url));
  const result = await postcss([tailwind()]).process(await readFile(from, 'utf8'), { from });
  // Inlining these tokens freezes the authenticated dashboards in light mode.
  for (const [selector, property, token] of [
    ['.bg-surface', 'background-color', '--color-surface'],
    ['.bg-surface-container-lowest', 'background-color', '--color-surface-container-lowest'],
    ['.text-on-surface', 'color', '--color-on-surface'],
    ['.bg-primary', 'background-color', '--color-primary'],
  ]) {
    let value;
    result.root.walkRules(selector, rule => {
      rule.walkDecls(property, declaration => { value = declaration.value; });
    });
    assert.equal(value, `var(${token})`, `${selector} must respond to theme changes`);
  }
});
