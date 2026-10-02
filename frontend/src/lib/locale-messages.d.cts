export type Locale = 'th' | 'en';
export const messages: Record<Locale, Record<string, string>>;
export function formatLocaleDate(value: Date | string | number, locale: Locale): string;
