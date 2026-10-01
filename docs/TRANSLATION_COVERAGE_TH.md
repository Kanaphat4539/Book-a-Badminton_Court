# Thai/English localization coverage — current handoff

## Implemented in this change
- `LocaleProvider`: Thai SSR default; restores `site-locale` after hydration, updates `document.documentElement.lang`, and remains usable when `localStorage` is blocked. Adds localized date formatting (`th-TH` Buddhist era / `en-US`) with Asia/Bangkok timezone and invalid-date fallback.
- Shared navigation language control has accessible name, pressed state, keyboard focus styling; sidebar labels and notification empty state are localized.
- Admin user-management headings, search, loading/empty context, table headings/actions, confirmation prompts, and operation toasts use locale messages.
- Login/register operation success/error messages use locale messages; switch controls expose pressed state and keyboard focus.
- Scan/check-in guidance, state labels, and backend error toasts use localized messages; unknown backend messages are never shown raw and fall back to a safe localized retry prompt.
- Admin reset-quota/ban confirmation prompts use localized templates with the username retained; known API errors map to curated Thai/English messages, unknown payloads use the safe retry prompt. API routes/payloads, auth guards, roles, and account actions are unchanged.

## Verification
- `node --test src/lib/locale-messages.test.cjs`: 3 passed (dictionary parity/nonempty values, Buddhist/Gregorian dates, invalid date).
- `npx tsc --noEmit`: passed after current changes.
- Focused ESLint reported existing page issues and one newly surfaced provider lint issue which was addressed with a documented hydration-only suppression. Re-run focused ESLint to confirm. Pre-existing page lint includes `any`, unused imports/state, effect-dependency and ordering warnings/errors; this work did not alter auth guards or API requests.

## Coverage updated in this change
- Added 43 paired message keys for landing/news headlines and menus, auth labels, booking loading errors, footer content, and notification status/details; both locale dictionaries are tested for parity/nonempty content.
- Landing/news headline labels, booking court-load errors, select-court loading indicator, and register form prompts/labels now use locale messages.
- Desktop footer labels/body/status and notification type/status/metadata labels use locale messages. Dynamic system notification message, student names/IDs, booking IDs/times, brand names, and machine status values remain unchanged.
- Added `site-localization.test.cjs`; it checks required route message keys exist in both languages and differ. Focused run: 4 tests passed; `npx tsc --noEmit` passed.
- Scoped ESLint still reports legacy problems in touched pages (29 errors, largely pre-existing unescaped content/`any`; 17 warnings). No unrelated mass autofix was applied.

## Remaining gaps
- The landing page's longer guide/tips/rules copy and portions of booking/select-court and auth form helper copy remain hard-coded; the home/news cards include static source text and date presentation.
- Browser persistence/navigation and blocked-storage behavior have not been exercised.
- Root `<html lang="th">` remains the intentional server-rendered default; provider updates it to persisted locale after hydration.
