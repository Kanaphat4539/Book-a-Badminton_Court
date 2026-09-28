'use client';

import { useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { PasswordRecoveryShell } from '@/components/PasswordRecoveryShell';

const genericMessage = 'If this email belongs to an account, a reset link will be sent. Check your inbox and spam folder.';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (cause) {
      setError(axios.isAxiosError(cause) && typeof cause.response?.data?.message === 'string'
        ? cause.response.data.message : 'Could not send a reset link. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PasswordRecoveryShell title="Forgot password?" description="Enter the KMITL email address used for your student account.">
      {sent ? (
        <p role="status" className="rounded-xl bg-orange-50 p-4 text-sm leading-6 text-gray-800 dark:bg-orange-950 dark:text-orange-50">{genericMessage}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="recovery-email" className="mb-2 block text-sm font-semibold">KMITL email</label>
            <input id="recovery-email" type="email" autoComplete="email" required maxLength={255}
              value={email} onChange={event => setEmail(event.target.value)}
              placeholder="name@kmitl.ac.th"
              className="w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-orange-900 dark:bg-[#140900] dark:text-orange-50" />
          </div>
          {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-white disabled:opacity-60">
            {submitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
    </PasswordRecoveryShell>
  );
}
