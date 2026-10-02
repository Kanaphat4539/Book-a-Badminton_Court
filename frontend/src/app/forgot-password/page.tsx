'use client';

import { useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { useLocale } from '@/components/locale-provider';
import { translate as authNewsText } from '@/lib/auth-news-messages.cjs';
import { PasswordRecoveryShell } from '@/components/PasswordRecoveryShell';

export default function ForgotPasswordPage() {
  const { locale } = useLocale();
  const text = (key: string) => authNewsText(key, locale);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/auth/reset-password-direct', { email, password, confirmPassword });
      setSent(true);
    } catch (cause) {
      setError(axios.isAxiosError(cause) && typeof cause.response?.data?.message === 'string'
        ? cause.response.data.message : text('resetLinkError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PasswordRecoveryShell title={text('forgotPasswordTitle')} description={text('forgotPasswordDesc')}>
      {sent ? (
        <p role="status" className="rounded-xl bg-green-50 p-4 text-sm leading-6 text-gray-800 dark:bg-green-950 dark:text-green-50">{text('resetPasswordDone')}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="recovery-email" className="mb-2 block text-sm font-semibold">{text('kmitlEmailLabel')}</label>
            <input id="recovery-email" type="email" autoComplete="email" required maxLength={255}
              value={email} onChange={event => setEmail(event.target.value)}
              placeholder="name@kmitl.ac.th"
              className="w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-orange-900 dark:bg-[#140900] dark:text-orange-50" />
          </div>
          <div>
            <label htmlFor="recovery-password" className="mb-2 block text-sm font-semibold">{text('newPasswordLabel')}</label>
            <input id="recovery-password" type="password" autoComplete="new-password" required minLength={8} maxLength={72}
              value={password} onChange={event => setPassword(event.target.value)}
              placeholder="Enter new password"
              className="w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-orange-900 dark:bg-[#140900] dark:text-orange-50" />
          </div>
          <div>
            <label htmlFor="recovery-confirm" className="mb-2 block text-sm font-semibold">{text('confirmPasswordLabel')}</label>
            <input id="recovery-confirm" type="password" autoComplete="new-password" required minLength={8} maxLength={72}
              value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-orange-900 dark:bg-[#140900] dark:text-orange-50" />
          </div>
          {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-white disabled:opacity-60">
            {submitting ? text('updatingPassword') : text('updatePassword')}
          </button>
        </form>
      )}
    </PasswordRecoveryShell>
  );
}
