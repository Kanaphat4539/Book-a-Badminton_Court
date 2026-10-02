import Link from 'next/link';

export function PasswordRecoveryShell({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-5 py-12 text-on-surface dark:bg-[#140e0b]">
      <section className="w-full max-w-md rounded-3xl border border-outline-variant/50 bg-white p-7 shadow-xl dark:border-[#ff6b00]/20 dark:bg-[#241911] sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">KMITL BADMINTON</p>
        <h1 className="mt-4 text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-on-surface-variant dark:text-orange-100/70">{description}</p>
        <div className="mt-7">{children}</div>
        <Link href="/login" className="mt-7 inline-flex text-sm font-semibold text-primary hover:underline">← Back to Login</Link>
      </section>
    </main>
  );
}
