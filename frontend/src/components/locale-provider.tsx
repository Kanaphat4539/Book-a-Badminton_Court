'use client';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { messages } from '@/lib/locale-messages.cjs';

type Locale = 'th' | 'en';
type Messages = Record<string, string>;
const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: (key: string) => string; formatDate: (value: Date | string | number) => string } | null>(null);
function readSavedLocale(): Locale {
  try { return window.localStorage.getItem('site-locale') === 'en' ? 'en' : 'th'; } catch { return 'th'; }
}
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('th');
  useEffect(() => {
    const saved = readSavedLocale();
    // localStorage is client-only; defer persisted preference until after Thai SSR hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(saved);
    document.documentElement.lang = saved;
  }, []);
  const setLocale = (next: Locale) => {
    setLocaleState(next);
    document.documentElement.lang = next;
    try { window.localStorage.setItem('site-locale', next); } catch { /* Keep current-session selection when storage is blocked. */ }
  };
  const value = useMemo(() => ({
    locale, setLocale,
    t: (key: string) => (messages[locale] as Messages)[key] ?? key,
    formatDate: (value: Date | string | number) => {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return '—';
      return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', { dateStyle: 'medium', timeZone: 'Asia/Bangkok' }).format(date);
    },
  }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
}
/**
 * For shell components that can be mounted without the provider (error boundaries, overlays):
 * falls back to the Thai default instead of throwing, matching the provider's SSR default.
 */
export function useOptionalLocale() {
  return useContext(LocaleContext);
}
export const languageMessages = messages;
