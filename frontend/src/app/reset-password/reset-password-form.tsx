'use client';

import { useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { useLocale } from '@/components/locale-provider';
import { translate as authNewsText } from '@/lib/auth-news-messages.cjs';
import { PasswordRecoveryShell } from '@/components/PasswordRecoveryShell';

export default function ResetPasswordForm({ token }: { token: string }) {
  const { locale } = useLocale();
  const text = (key: string) => authNewsText(key, locale);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const validLink = /^[a-f0-9]{64}$/.test(token);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmation) {
      setError(text('passwordMismatch'));
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError(text('passwordTooLong'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      window.history.replaceState(null, '', '/reset-password');
      setDone(true);
    } catch (cause) {
      setError(axios.isAxiosError(cause) && typeof cause.response?.data?.message === 'string'
        ? cause.response.data.message : text('updatePasswordFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PasswordRecoveryShell title={text('resetPasswordTitle')} description={text('resetPasswordDesc')}>
      {done ? (
        <p role="status" className="rounded-xl bg-orange-50 p-4 text-sm text-gray-800 dark:bg-orange-950 dark:text-orange-50">{text('resetPasswordDone')}</p>
      ) : !validLink ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">{text('resetPasswordInvalidLink')}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="new-password" className="mb-2 block text-sm font-semibold">{text('newPasswordLabel')}</label>
            <input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={72}
              value={password} onChange={event => setPassword(event.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-orange-900 dark:bg-[#140900] dark:text-orange-50" />
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold">{text('confirmPasswordLabel')}</label>
            <input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={72}
              value={confirmation} onChange={event => setConfirmation(event.target.value)}
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
