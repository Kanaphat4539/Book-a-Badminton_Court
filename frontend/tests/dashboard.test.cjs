const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Render the actual page with API-shaped state. Replace browser-only hooks,
// navigation and HTTP so these regressions run without a server or account.
function dashboard(bookings, { admin = false, selected = null } = {}) {
  const effects = [];
  const timers = [];
  const posts = [];
  const updates = [];
  const states = [
    { name: 'Test Player', username: 'player', role: admin ? 'ADMIN' : 'STUDENT' },
    bookings, bookings, '--:--', selected, '--:--', true,
  ];
  let index = 0;
  const api = {
    get: async () => ({ data: bookings }),
    post: async (url) => { posts.push(url); },
  };
  const source = fs.readFileSync(path.join(__dirname, '../src/app/dashboard/page.tsx'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, console,
    confirm: () => true,
    setInterval: (callback) => { timers.push(callback); return timers.length; },
    clearInterval: () => {},
    require: (id) => {
      if (id === 'react') return {
        ...React,
        useState: () => { const slot = index++; return [states[slot], (value) => updates.push([slot, value])]; },
        useEffect: (callback) => effects.push(callback),
      };
      if (id === 'next/navigation') return { useRouter: () => ({ push() {} }) };
      if (id === '@/lib/api') return { default: api };
      if (id === 'sonner') return { toast: { success() {}, error() {} } };
      if (id === '@/components/MainLayout') return { default: ({ children }) => children };
      return require(id);
    },
  });
  const tree = module.exports.default();
  return { tree, html: renderToStaticMarkup(tree), effects, timers, posts, updates };
}

const booking = {
  booking_id: 42, court: 3, booking_date: '2099-09-15',
  time_in: '10:00:00', time_out: '11:00:00', status: 'PENDING',
};

for (const status of ['PENDING', 'CHECKED_IN', 'COMPLETED', 'CANCELLED']) {
  test(`renders ${status} booking with the current API fields`, () => {
    const { html } = dashboard([{ ...booking, status }]);
    assert.match(html, /10:00/);
    assert.match(html, /Court 3/);
    if (status === 'PENDING' || status === 'CHECKED_IN') assert.match(html, /11:00/);
  });
}

test('missing booking times render placeholders without crashing', () => {
  const { html } = dashboard([{ ...booking, time_in: undefined, time_out: null }]);
  assert.match(html, /--:--/);
});

function buttons(tree) {
  if (!tree || typeof tree !== 'object') return [];
  return [
    ...(tree.type === 'button' ? [tree] : []),
    ...React.Children.toArray(tree.props?.children).flatMap(buttons),
  ];
}

test('both student cancel controls use booking_id', async () => {
  const result = dashboard([booking]);
  for (const button of buttons(result.tree).filter((node) => /cancel/i.test(renderToStaticMarkup(node)))) {
    await button.props.onClick();
  }
  assert.deepEqual(result.posts, ['/bookings/42/cancel', '/bookings/42/cancel']);
});

test('student countdown uses time_out instead of the removed end_time field', () => {
  const result = dashboard([{ ...booking, status: 'CHECKED_IN' }]);
  result.effects.at(-1)();
  result.timers[0]();
  assert.match(result.updates.find(([slot]) => slot === 3)[1], /^\d+:\d{2}$/);
});

test('admin finish control uses booking_id', async () => {
  const selected = { ...booking, status: 'CHECKED_IN' };
  const result = dashboard([selected], { admin: true, selected });
  const finish = buttons(result.tree).find((node) => /finish/i.test(renderToStaticMarkup(node)));
  await finish.props.onClick();
  assert.deepEqual(result.posts, ['/bookings/42/finish']);
});
