'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from '@/components/locale-provider';
import { translate as authNewsText } from '@/lib/auth-news-messages.cjs';
import ResetPasswordForm from './reset-password-form';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage() {
  const { locale } = useLocale();
  const _text = (key: string) => authNewsText(key, locale);

  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
