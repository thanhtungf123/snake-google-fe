'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { apiFetch } from '@/lib/api';

interface RecentGame {
  score: number;
  status: string;
  playedAt: string | null;
}
interface Profile {
  nickname: string;
  avatarUrl: string | null;
  joinedAt: string | null;
  personalBest: number;
  gamesPlayed: number;
  rank: number;
  recentGames: RecentGame[];
}

export default function ProfileClient() {
  const t = useTranslations('Profile');
  const locale = useLocale();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [state, setState] = useState<'loading' | 'unauth' | 'ready'>('loading');

  useEffect(() => {
    apiFetch('/api/profile')
      .then(async (r) => {
        if (r.status === 401) {
          setState('unauth');
          return;
        }
        const d = await r.json();
        setProfile(d.profile);
        setState('ready');
      })
      .catch(() => setState('unauth'));
  }, []);

  if (state === 'loading') {
    return <p className="opacity-60">…</p>;
  }

  if (state === 'unauth' || !profile) {
    return (
      <div className="space-y-3">
        <p className="opacity-80">{t('loginRequired')}</p>
        <Link
          href="/login"
          className="inline-block rounded bg-snake px-4 py-2 font-semibold text-white"
        >
          {t('goLogin')}
        </Link>
      </div>
    );
  }

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US') : '—';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-snake text-2xl font-bold text-white">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            profile.nickname.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{profile.nickname}</h2>
          <p className="text-sm opacity-60">
            {t('joined')}: {fmtDate(profile.joinedAt)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label={t('personalBest')} value={profile.personalBest} />
        <Stat label={t('rank')} value={`#${profile.rank}`} />
        <Stat label={t('gamesPlayed')} value={profile.gamesPlayed} />
      </div>

      {/* Links to Stats / History */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/stats"
          className="rounded bg-black/5 px-4 py-2 text-sm font-medium hover:bg-black/10"
        >
          {t('viewStats')} →
        </Link>
        <Link
          href="/history"
          className="rounded bg-black/5 px-4 py-2 text-sm font-medium hover:bg-black/10"
        >
          {t('viewHistory')} →
        </Link>
        <Link
          href="/achievements"
          className="rounded bg-black/5 px-4 py-2 text-sm font-medium hover:bg-black/10"
        >
          {t('viewAchievements')} →
        </Link>
        <Link
          href="/challenges"
          className="rounded bg-black/5 px-4 py-2 text-sm font-medium hover:bg-black/10"
        >
          {t('viewChallenges')} →
        </Link>
        <Link
          href="/account"
          className="rounded bg-black/5 px-4 py-2 text-sm font-medium hover:bg-black/10"
        >
          {t('editAccount')} →
        </Link>
      </div>

      {/* Recent games */}
      <div>
        <h3 className="mb-2 text-lg font-semibold">{t('recentGames')}</h3>
        {profile.recentGames.length === 0 ? (
          <p className="opacity-60">{t('noGames')}</p>
        ) : (
          <ul className="divide-y divide-black/10">
            {profile.recentGames.map((g, i) => (
              <li key={i} className="flex items-center justify-between py-2">
                <span className="tabular-nums">
                  {t('score')}: <strong>{g.score}</strong>
                  {g.status === 'flagged' && (
                    <span className="ml-2 text-xs text-yellow-600">({t('flagged')})</span>
                  )}
                </span>
                <span className="text-sm opacity-60">{fmtDate(g.playedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-black/5 p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-60">{label}</div>
    </div>
  );
}
