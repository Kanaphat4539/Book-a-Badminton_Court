const test = require('node:test');
const assert = require('node:assert/strict');
const { messages } = require('./locale-messages.cjs');

test('whole-site route copy has explicit Thai and English messages', () => {
  const required = ['heroHeadline','heroLogin','menuHome','menuServices','menuNews','menuGuide','menuTips','menuRules','serviceIntro','newsIntro','newsTermsTitle','newsStatsTitle','newsNew','loginLabel','registerPrompt','registerTitle','emailLabel','departmentLabel','yearLabel','credentialsTitle','registering','alreadyAccount','bookingLoadError','selectCourtLoading','selectCourtConfirm','footerDescription','footerPlatform','footerBookings','footerSchedule','footerSupport','footerHelp','footerHours','footerStatus','notificationSystem','notificationBookingCancelled','notificationNewBooking','notificationCheckin','notificationComplete','notificationSuccess','notificationCourt','notificationDate','notificationByStudent'];
  for (const key of required) {
    assert.ok(messages.th[key], `Thai message missing: ${key}`);
    assert.ok(messages.en[key], `English message missing: ${key}`);
    assert.notEqual(messages.th[key], messages.en[key], `Untranslated message: ${key}`);
  }
});
