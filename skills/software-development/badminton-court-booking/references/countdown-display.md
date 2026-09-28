# Countdown Display — Scan & Dashboard

After `checkIn` succeeds (`status` becomes `CHECKED_IN`):
- Show visible countdown/state message on scan page instead of silent redirect.
- Example message: "Court X • 11:00 - 12:00 • Playing now — countdown active"
- Dashboard countdown calculates to `time_out` from `CHECKED_IN` status.
