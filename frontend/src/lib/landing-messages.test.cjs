const test = require('node:test');
const assert = require('node:assert/strict');
const { landingMessages } = require('./landing-messages.cjs');
const fs = require('node:fs');
const path = require('node:path');
const page = fs.readFileSync(path.join(__dirname, '../app/page.tsx'), 'utf8');

test('Thai and English landing copy have identical keys and all visible sections', () => {
  assert.deepEqual(Object.keys(landingMessages.th).sort(), Object.keys(landingMessages.en).sort());
  for (const key of ['guideTitle', 'guideIntro', 'guideStep1Title', 'guideStep1Body', 'guideStep2Title', 'guideStep2Body', 'guideStep3Title', 'guideStep3Body', 'guideStep4Title', 'guideStep4Body', 'tipsTitle', 'tipsIntro', 'tipsWarmTitle', 'tipsWarmBody', 'tipsStringTitle', 'tipsStringBody', 'rulesTitle', 'rulesIntro', 'rulesBookingTitle', 'rulesBookingLimit', 'rulesAdvance', 'rulesAccessTitle', 'rulesIdentity', 'rulesLate', 'rulesCancelTitle', 'rulesCancellation', 'rulesPenalty', 'rulesCourtTitle', 'rulesFootwear', 'footerDescription', 'footerRules', 'footerContact']) {
    assert.equal(typeof landingMessages.th[key], 'string', `Thai ${key}`);
    assert.ok(landingMessages.th[key].trim(), `Thai ${key} is nonempty`);
    assert.ok(landingMessages.en[key].trim(), `English ${key} is nonempty`);
    assert.notEqual(landingMessages.th[key], landingMessages.en[key], `${key} is translated`);
  }
  assert.match(landingMessages.en.rulesLate, /15 minutes/);
  assert.match(landingMessages.en.rulesPenalty, /2 .*No-shows.*7-day/);
  assert.match(landingMessages.en.rulesBookingLimit, /1 booking per day.*1 hour/);
});

test('reviewed visible landing literals are dictionary-wired instead of hard-coded JSX', () => {
  const knownLiterals = [
    '>News <', '>Log in to Console<', 'aria-label="Open menu"', '>Connect with <',
    ">Let's Go <", '>Enable real-time court reservations and management for KMITL students and staff.<',
    '>Let athletes easily log in and connect with their KMITL Badminton ID.<',
    '>Link your booking with the court via QR code scanning framework.<',
    'The Terms of Use (for KMITL Athletes) will be revised on July 27, 2026.',
    "you've played, your most frequently visited courts, and more...", '>Court Booking</',
    '>Dashboard Update</', '>Check-in</', 'Go to slide'
  ];
  for (const literal of knownLiterals) assert.ok(!page.includes(literal), `unwired visible literal remains: ${literal}`);
  for (const key of ['menuNews', 'loginToConsole', 'openMenu', 'heroConnect', 'heroCta', 'slideLabel', 'serviceBookingBody', 'serviceMembershipBody', 'serviceCheckinBody', 'newsTermsBody', 'newsStatsBody', 'newsCourtCategory', 'newsDashboardCategory', 'guideStep4Title']) {
    assert.match(page, new RegExp(`(?:copy\\.${key}|t\\('${key}'\\))`), `landing page wires ${key}`);
    assert.ok(landingMessages.th[key]?.trim(), `Thai ${key}`);
    assert.ok(landingMessages.en[key]?.trim(), `English ${key}`);
    assert.notEqual(landingMessages.th[key], landingMessages.en[key], `${key} has localized values`);
  }
});
