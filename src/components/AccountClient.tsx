'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { apiFetch } from '@/lib/api';
import { AUTH_EVENT } from './AuthNav';

interface Account {
  nickname: string;
  email: string | null;
  avatarUrl: string | null;
}

export default function AccountClient() {
  const t = useTranslations('Account');
  const [state, setState] = useState<'loading' | 'unauth' | 'ready'>('loading');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    apiFetch('/api/account')
      .then(async (r) => {
        if (r.status === 401) {
          setState('unauth');
          return;
        }
        const d: { account: Account } = await r.json();
        setNickname(d.account.nickname);
        setEmail(d.account.email ?? '');
        setAvatarUrl(d.account.avatarUrl ?? '');
        setState('ready');
      })
      .catch(() => setState('unauth'));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const r = await apiFetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, email, avatarUrl }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Error');
      setProfileMsg({ ok: true, text: t('saved') });
      // Cập nhật nav (nickname/avatar có thể đã đổi).
      window.dispatchEvent(new Event(AUTH_EVENT));
    } catch (err) {
      setProfileMsg({ ok: false, text: (err as Error).message });
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPw(true);
    setPwMsg(null);
    try {
      const r = await apiFetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Error');
      setPwMsg({ ok: true, text: t('passwordChanged') });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPwMsg({ ok: false, text: (err as Error).message });
    } finally {
      setSavingPw(false);
    }
  }

  if (state === 'loading') return <p className="opacity-60">…</p>;

  if (state === 'unauth') {
    return (
      <div className="space-y-3">
        <p className="opacity-80">{t('loginRequired')}</p>
        <Link href="/login" className="inline-block rounded bg-snake px-4 py-2 font-semibold text-white">
          {t('goLogin')}
        </Link>
      </div>
    );
  }

  const field = 'w-full rounded border border-black/15 px-3 py-2 text-sm';
  const msgClass = (ok: boolean) => (ok ? 'text-green-700' : 'text-red-600');

  return (
    <div className="space-y-10">
      {/* Profile form */}
      <form onSubmit={saveProfile} className="space-y-4">
        <h2 className="text-lg font-semibold">{t('profileSection')}</h2>
        <label className="block text-sm">
          <span className="mb-1 block opacity-60">{t('nickname')}</span>
          <input className={field} value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block opacity-60">{t('email')}</span>
          <input
            type="email"
            className={field}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block opacity-60">{t('avatarUrl')}</span>
          <input className={field} value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          <span className="mt-1 block text-xs opacity-50">{t('avatarHint')}</span>
        </label>
        {profileMsg && <p className={msgClass(profileMsg.ok)}>{profileMsg.text}</p>}
        <button
          disabled={savingProfile}
          className="rounded bg-snake px-5 py-2 font-semibold text-white disabled:opacity-50"
        >
          {t('saveProfile')}
        </button>
      </form>

      {/* Password form */}
      <form onSubmit={savePassword} className="space-y-4 border-t border-black/10 pt-8">
        <h2 className="text-lg font-semibold">{t('passwordSection')}</h2>
        <label className="block text-sm">
          <span className="mb-1 block opacity-60">{t('currentPassword')}</span>
          <input
            type="password"
            className={field}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block opacity-60">{t('newPassword')}</span>
          <input
            type="password"
            className={field}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        {pwMsg && <p className={msgClass(pwMsg.ok)}>{pwMsg.text}</p>}
        <button
          disabled={savingPw}
          className="rounded bg-snake px-5 py-2 font-semibold text-white disabled:opacity-50"
        >
          {t('savePassword')}
        </button>
      </form>
    </div>
  );
}
