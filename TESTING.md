# Testing Guide — Book-a-Badminton_Court

This project is tested across the four standard levels: **Unit → Integration → System → Acceptance**, covering both the NestJS backend and the Next.js frontend.

| Level | Backend (NestJS) | Frontend (Next.js) |
|---|---|---|
| **1. Unit** | Jest + `@nestjs/testing`, all deps mocked — no DB, no HTTP | Vitest + React Testing Library (jsdom) |
| **2. Integration** | Jest + real TypeORM on in-memory SQLite | Vitest + RTL with the API layer mocked |
| **3. System** | `supertest` over a fully booted Nest app + in-memory DB | Playwright: real browser → Next.js → backend |
| **4. Acceptance** | — | Playwright, one spec per user story |

Total: **72 backend tests** (53 unit + 10 integration + 9 e2e/system, all green) and **17 frontend tests** (11 unit + 2 integration + 3 acceptance + 3 system UI).

> The backend on this branch is the **nongpooh** version: users are split into separate `Admin` (`admin_id`) and `Student` (`stu_id`, `@kmitl.ac.th` email, name/major/year) entities, and `UserRole` is `STUDENT` | `ADMIN`. The tests target that structure.

---

## How to run

### Backend (`cd backend`)

```bash
npm install            # first time only (see "Native modules" note below)
npm test               # Level 1 — unit tests (*.spec.ts)
npm run test:integration   # Level 2 — integration tests (in-memory SQLite)
npm run test:e2e       # Level 3 — system tests (supertest)
npm run test:cov       # unit tests with a coverage report
```

### Frontend (`cd frontend`)

```bash
npm install            # first time only
npm test               # Levels 1 & 2 — Vitest (unit + integration)
npm run test:e2e       # Levels 3 & 4 — Playwright (system + acceptance)
```

Playwright starts the backend (on port **4001**, in-memory DB) and reuses/starts the
frontend (port 3000) automatically. First run only: `npx playwright install chromium`.

---

## What each level proves

### Level 1 — Unit
- **Backend** (`backend/src/**/*.spec.ts`): each service/controller/guard in isolation with mocked repositories — `AuthService` password checks & registration, `BookingsService` booking rules, `CourtsService` availability grouping, `UsersService` password hashing, `CronService` stale-booking sweep, `RolesGuard` allow/deny logic, and controller delegation.
- **Frontend** (`frontend/src/**/*.test.ts(x)`): the `api` axios interceptor (attaches/omits the JWT), the pure booking-time helpers in `src/lib/time.ts`, and the `ThemeToggle` component.

### Level 2 — Integration
- **Backend** (`backend/test/integration/*.integration-spec.ts`): real service ↔ TypeORM ↔ entity wiring against in-memory SQLite — booking persists and is read back, double-booking is rejected, availability reflects create/cancel, and the auth round-trip proves bcrypt hashing + JWT signing work together.
- **Frontend** (`frontend/src/app/login/page.test.tsx`): `LoginPage` rendered with the API layer mocked — asserts the right request body, token/user stored in `localStorage`, and success/error toasts.

### Level 3 — System
- **Backend** (`backend/test/app.e2e-spec.ts`): real HTTP through the whole stack — register → login → availability → book → my-bookings, plus 401 (unauthenticated), 403 (student hitting an admin-only route), and the seeded admin viewing all bookings.
- **Frontend** (`frontend/e2e/system.spec.ts`): real browser — logged-out `/booking` redirects to `/login`, invalid login shows an error and stays put, valid login stores a JWT and reaches `/dashboard`.

### Level 4 — Acceptance
`frontend/e2e/acceptance.spec.ts` — each spec title is a user story:
- *As a student, I can register a new account and land on the dashboard.*
- *As a student, I can log in and open the booking calendar for today.*
- *As an admin, I can log in and reach the admin dashboard.*

---

## Bugs fixed and covered by tests

Two of the bugs found during review are **fixed** on this branch and locked down by tests:

| # | Bug | Fix | Test |
|---|---|---|---|
| **#01** | Register trusted a client-supplied `role`, allowing self-promotion to ADMIN | `AuthService.register` always creates a `Student` | `backend/src/auth/auth.service.spec.ts` |
| **#06** | The 23:00 slot produced an invalid `24:00:00` end time (unbounded hour + 1) | `createBooking` rejects a start hour ≥ 23 and malformed times before building the slot | `backend/src/bookings/bookings.service.spec.ts` |

Other issues that still apply (booking race condition, UTC-vs-local date handling, midnight cron edge case, CORS wide open, hardcoded JWT secret) are catalogued in `issue-checklist.html` at the repo root.

---

## Native modules note (backend)

This environment blocks package install scripts by default, but `bcrypt` and
`better-sqlite3` are native modules that must be built. If tests fail to load
them, approve their build scripts once:

```bash
npm approve-scripts bcrypt
npm approve-scripts better-sqlite3
```
