# `/booking/select-court` localization

The page uses its own `select-court-copy.cjs` TH/EN dictionary via the locale provider's stable `locale`. Keep court inventory names and cached user names as supplied; never translate or alter API payloads (`date` remains ISO and `startTime` remains `HH:mm:ss`). Date/session labels continue through the existing locale-aware `formatBookingDate` and confirmation date formatter.

## Copy inventory

- Session summary: selected time, change time, date/session display.
- Page heading, available court count, hall/count summary, student quota chip.
- Court cards: available/booked, indoor, location labels, student benefit, daily-free note, unavailable/book action, image alt text; court names are user/API data.
- Loading and toasts: availability loading/error, today-only redirect policy, missing parameters, expired slot, booking result, refresh error, API booking errors via existing read-only `bookingErrorMessage`.
- Reminder and confirmation modal: title, description, date/month/court/time/booker labels and values, booking rules, cancel/back and confirm/loading buttons.
- Dynamic user/booker and court names are data, not translated; fallback labels are localized.

## Exceptions / behavior kept

- Gymnasium brand identifiers and KMITL remain proper names. The Main/West location tags are already English; translated East/North tags are localized.
- Backend error messages are mapped through the existing page-localized helper; raw error text is not rendered.
- Date/time formatting, availability requests, court selection, quota/ban rules, booking request shape, and redirect behavior are unchanged.
- Icon glyphs and decorative image URLs are not copy.

## Verification

Run `node --test src/lib/select-court-copy.test.cjs` and `npx tsc --noEmit` from `frontend/`. The focused Node test verifies that all literal page dictionary keys exist in both locales and that count interpolation is locale-specific.
