'use client';

import { FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { apiFetch } from '@/lib/api';

export default function ResetPasswordClient() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError(t('passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('genericError'));
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setError(t('genericError'));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-red-600">{t('resetNoToken')}</p>
        <Link href="/forgot-password" className="inline-block text-snake hover:underline">
          {t('forgotTitle')}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <p className="opacity-80">{t('resetDone')}</p>
        <Link href="/login" className="inline-block text-snake hover:underline">
          {t('backToLogin')}
        </Link>
      </div>
    );
  }

  const inputCls =
    'w-full rounded border border-black/15 px-3 py-2 outline-none focus:border-snake';

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm opacity-70">{t('newPassword')}</span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          autoComplete="new-password"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm opacity-70">{t('confirmPassword')}</span>
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputCls}
          autoComplete="new-password"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-snake py-2 font-semibold text-white disabled:opacity-60"
      >
        {t('resetSubmit')}
      </button>
    </form>
  );
}
