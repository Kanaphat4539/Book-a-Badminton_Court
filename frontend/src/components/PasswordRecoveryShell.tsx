'use client';

import Link from 'next/link';
import { useLocale } from '@/components/locale-provider';
import { translate as authNewsText } from '@/lib/auth-news-messages.cjs';

export function PasswordRecoveryShell({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const { locale, setLocale } = useLocale();
  const text = (key: string) => authNewsText(key, locale);

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-5 py-12 text-on-surface dark:bg-[#140e0b] relative">
      <div className="absolute top-6 right-6 z-10">
        <button
          type="button"
          aria-label={locale === 'th' ? 'Switch language to English' : 'เปลี่ยนภาษาเป็นไทย'}
          aria-pressed={locale === 'en'}
          onClick={() => setLocale(locale === 'th' ? 'en' : 'th')}
          className="rounded-lg border border-primary/40 bg-black/40 px-3 py-2 text-sm font-bold text-white hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {locale === 'th' ? 'English' : 'ไทย'}
        </button>
      </div>
      <section className="w-full max-w-md rounded-3xl border border-outline-variant/50 bg-white p-7 shadow-xl dark:border-[#ff6b00]/20 dark:bg-[#241911] sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">KMITL BADMINTON</p>
        <h1 className="mt-4 text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-on-surface-variant dark:text-orange-100/70">{description}</p>
        <div className="mt-7">{children}</div>
        <Link href="/login" className="mt-7 inline-flex text-sm font-semibold text-primary hover:underline">{text('backToLogin')}</Link>
      </section>
    </main>
  );
}
