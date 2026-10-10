'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { apiFetch } from '@/lib/api';
import { AUTH_EVENT } from './AuthNav';
import { Skeleton } from '@/components/ui/Skeleton';

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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

  // Upload avatar lên Cloudinary: xin chữ ký ở backend rồi POST thẳng lên Cloudinary.
  async function onPickAvatar(file: File | undefined) {
    if (!file) return;
    setProfileMsg(null);
    setUploadingAvatar(true);
    try {
      const sr = await apiFetch('/api/account/upload/signature');
      const sig: {
        cloudName: string;
        apiKey: string;
        timestamp: number;
        folder: string;
        signature: string;
        error?: string;
      } = await sr.json();
      if (!sr.ok) throw new Error(sig.error || t('uploadFailed'));
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sig.apiKey);
      fd.append('timestamp', String(sig.timestamp));
      fd.append('folder', sig.folder);
      fd.append('signature', sig.signature);
      const r = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
        method: 'POST',
        body: fd,
      });
      const d = await r.json();
      if (!r.ok || !d.secure_url) throw new Error(d?.error?.message || t('uploadFailed'));
      setAvatarUrl(d.secure_url as string);
      setProfileMsg({ ok: true, text: t('avatarUploaded') });
    } catch (err) {
      setProfileMsg({ ok: false, text: (err as Error).message });
    } finally {
      setUploadingAvatar(false);
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

  if (state === 'loading')
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-9 w-32" />
      </div>
    );

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
        <div className="block text-sm">
          <span className="mb-1 block opacity-60">{t('avatar')}</span>
          <div className="flex items-center gap-3">
            {/* Preview */}
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-16 w-16 flex-none rounded-full border border-black/10 object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 flex-none items-center justify-center rounded-full border border-black/10 text-xl font-semibold opacity-40">
                {(nickname || '?').charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingAvatar}
                  onChange={(e) => onPickAvatar(e.target.files?.[0])}
                />
                {uploadingAvatar ? t('uploading') : t('avatarUpload')}
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="ml-2 text-xs underline opacity-60 hover:opacity-100"
                >
                  {t('avatarRemove')}
                </button>
              )}
              {/* URL thủ công (vẫn giữ cho ai muốn dán link) */}
              <input
                className={field}
                value={avatarUrl}
                placeholder={t('avatarUrl')}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>
          </div>
          <span className="mt-1 block text-xs opacity-50">{t('avatarHint')}</span>
        </div>
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
