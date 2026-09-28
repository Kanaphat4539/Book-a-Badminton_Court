'use client';

import { useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { PasswordRecoveryShell } from '@/components/PasswordRecoveryShell';

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const validLink = /^[a-f0-9]{64}$/.test(token);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError('Password is too long. Use 72 bytes or fewer.');
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
        ? cause.response.data.message : 'Could not reset your password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PasswordRecoveryShell title="Set a new password" description="Choose a new password for your student account.">
      {done ? (
        <p role="status" className="rounded-xl bg-orange-50 p-4 text-sm text-gray-800 dark:bg-orange-950 dark:text-orange-50">Password updated. You can now sign in.</p>
      ) : !validLink ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">This reset link is invalid. Request a new link from the login page.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="new-password" className="mb-2 block text-sm font-semibold">New password</label>
            <input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={72}
              value={password} onChange={event => setPassword(event.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-orange-900 dark:bg-[#140900] dark:text-orange-50" />
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold">Confirm password</label>
            <input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={72}
              value={confirmation} onChange={event => setConfirmation(event.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-orange-900 dark:bg-[#140900] dark:text-orange-50" />
          </div>
          {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-white disabled:opacity-60">
            {submitting ? 'Updating...' : 'Update password'}
          </button>
        </form>
      )}
    </PasswordRecoveryShell>
  );
}
