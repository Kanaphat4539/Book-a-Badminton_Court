export type AdminDashboardLocale = 'th' | 'en';
export type AdminDashboardKey = keyof typeof import('./admin-dashboard-copy.cjs').adminDashboardCopy.th;
export const adminDashboardCopy: Record<AdminDashboardLocale, Record<AdminDashboardKey, string>>;
