export type PlayerUiLocale = 'th' | 'en';
export type PlayerUiKey = keyof typeof import('./player-ui-copy.cjs').playerUiCopy.th;
export const playerUiCopy: Record<PlayerUiLocale, Record<PlayerUiKey, string>>;
