import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const testsDir = dirname(fileURLToPath(import.meta.url));
const srcDir = join(testsDir, '..', 'src');
const thaiRange = /[\u0E00-\u0E7F]/;

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const walk = (dir) => readdirSync(dir).flatMap((entry) => {
  const full = join(dir, entry);
  return statSync(full).isDirectory() ? walk(full) : [full];
});

const pageFiles = walk(join(srcDir, 'app')).filter((file) => file.endsWith('page.tsx'));

test('every page in the app reads its copy from the localization system', () => {
  const pageNames = pageFiles.map((file) => relative(join(srcDir, 'app'), file).replace(/\\/g, '/')).sort();

  // Explicit list: adding a page without hooking up useLocale()/a dictionary must fail here.
  assert.deepEqual(pageNames, [
    'admin/users/page.tsx',
    'booking/page.tsx',
    'booking/select-court/page.tsx',
    'dashboard/page.tsx',
    'login/page.tsx',
    'news/page.tsx',
    'page.tsx',
    'register/page.tsx',
    'scan/page.tsx',
  ]);

  for (const file of pageFiles) {
    const source = read(file);
    assert.match(source, /useLocale\(|useOptionalLocale\(/, `${file} does not read the active locale`);
    assert.match(source, /from '@\/lib\/[\w.-]*(copy|messages)[\w.-]*\.cjs'/, `${file} has no Thai/English dictionary`);
  }
});

test('no page hard-codes user-facing Thai outside a locale ternary', () => {
  const allowed = [
    // The language switcher must name the *other* language, so its label is never translated.
    /aria-label=\{locale === 'th' \? 'Switch language to English' : 'เปลี่ยนภาษาเป็นไทย'\}/,
    /\{locale === 'th' \? 'English' : 'ไทย'\}/,
    /\{locale === 'th' \? 'EN' : 'ไทย'\}/,
    /\{locale === 'th' \? 'ระบบจองสนามแบดมินตัน' : 'Premium Court Booking'\}/,
  ];

  for (const file of pageFiles) {
    read(file).split('\n').forEach((line, index) => {
      const code = line.replace(/\/\/.*$/, '').trim();
      if (!thaiRange.test(code)) return;
      if (code.startsWith('//') || code.startsWith('*')) return;
      assert.ok(
        code.includes("locale === 'th'") || allowed.some((pattern) => pattern.test(line)),
        `${relative(srcDir, file)}:${index + 1} hard-codes Thai copy: ${code.slice(0, 120)}`,
      );
    });
  }
});

test('shell components that mount outside a page are fully localized', () => {
  const shells = [
    join(srcDir, 'components', 'BanPopup.tsx'),
    join(srcDir, 'components', 'loading-provider.tsx'),
    join(srcDir, 'components', 'ui', 'dialog.tsx'),
  ];

  for (const file of shells) {
    const source = read(file);
    assert.ok(!thaiRange.test(source), `${relative(srcDir, file)} still contains Thai-only copy`);
    assert.match(source, /playerUiCopy/, `${relative(srcDir, file)} does not use the player UI dictionary`);
  }
});

test('booking-display derives weekday and month names from the locale, not a Thai-only table', () => {
  const source = read(join(srcDir, 'lib', 'booking-display.ts'));

  assert.ok(!source.includes('thaiDays'), 'the hard-coded Thai weekday table is back');
  assert.match(source, /Intl\.DateTimeFormat\(localeTag\(locale\)/);
  assert.match(source, /locale: DisplayLocale = 'th'/);
  assert.match(source, /locale === 'th' \? `\$\{clock\} น\.` : clock/);
});

test('player UI dictionary stays in sync with the other dashboard dictionaries', async () => {
  const [{ playerUiCopy }, { playerDashboardCopy }] = await Promise.all([
    import('../src/lib/player-ui-copy.cjs'),
    import('../src/lib/player-dashboard-copy.cjs'),
  ]);

  for (const dictionary of [playerUiCopy, playerDashboardCopy]) {
    assert.deepEqual(Object.keys(dictionary.th).sort(), Object.keys(dictionary.en).sort());
  }
});
