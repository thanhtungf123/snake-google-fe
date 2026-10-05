'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { AUTH_EVENT } from './AuthNav';
import { apiFetch } from '@/lib/api';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login' ? { email, password } : { email, password, nickname };
      const res = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('genericError'));
        return;
      }
      window.dispatchEvent(new Event(AUTH_EVENT));
      router.push('/');
      router.refresh();
    } catch {
      setError(t('genericError'));
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    'w-full rounded border border-black/15 px-3 py-2 outline-none focus:border-snake';

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-sm space-y-3">
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

      {mode === 'register' && (
        <label className="block">
          <span className="mb-1 block text-sm opacity-70">{t('nickname')}</span>
          <input
            type="text"
            required
            minLength={3}
            maxLength={20}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className={inputCls}
          />
        </label>
      )}

      <label className="block">
        <span className="mb-1 block text-sm opacity-70">{t('password')}</span>
        <input
          type="password"
          required
          minLength={mode === 'register' ? 8 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-snake py-2 font-semibold text-white disabled:opacity-60"
      >
        {mode === 'login' ? t('login') : t('register')}
      </button>

      <p className="text-center text-sm">
        {mode === 'login' ? (
          <Link href="/register" className="text-snake hover:underline">
            {t('needAccount')}
          </Link>
        ) : (
          <Link href="/login" className="text-snake hover:underline">
            {t('haveAccount')}
          </Link>
        )}
      </p>
    </form>
  );
}
