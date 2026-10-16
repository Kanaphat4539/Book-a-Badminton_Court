export type AdminWelcomeLocale = 'th' | 'en';
export type AdminWelcomeKey = keyof typeof import('./admin-welcome-copy.cjs').adminWelcomeCopy.th;
export const adminWelcomeCopy: Record<AdminWelcomeLocale, Record<AdminWelcomeKey, string>>;
