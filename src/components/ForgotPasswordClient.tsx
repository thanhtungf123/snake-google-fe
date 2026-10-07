'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { apiFetch } from '@/lib/api';

export default function ForgotPasswordClient() {
  const t = useTranslations('Auth');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Luôn hiện thông báo thành công (không tiết lộ email nào tồn tại).
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <p className="opacity-80">{t('forgotSent')}</p>
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
      <p className="text-sm opacity-70">{t('forgotHint')}</p>
      <label className="block">
        <span className="mb-1 block text-sm opacity-70">{t('email')}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          autoComplete="email"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-snake py-2 font-semibold text-white disabled:opacity-60"
      >
        {t('forgotSubmit')}
      </button>
      <p className="text-center text-sm">
        <Link href="/login" className="text-snake hover:underline">
          {t('backToLogin')}
        </Link>
      </p>
    </form>
  );
}
