export type PlayerDashboardLocale = 'th' | 'en';
export type PlayerDashboardKey = keyof typeof import('./player-dashboard-copy.cjs').playerDashboardCopy.th;
export const playerDashboardCopy: Record<PlayerDashboardLocale, Record<PlayerDashboardKey, string>>;
