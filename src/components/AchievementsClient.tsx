'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { apiFetch } from '@/lib/api';

interface Item {
  code: string;
  unlocked: boolean;
  unlockedAt: string | null;
}
interface Data {
  total: number;
  unlockedCount: number;
  items: Item[];
}

// Icon theo code (không cần dịch).
const ICON: Record<string, string> = {
  first_game: '🎮',
  score_10: '🍎',
  score_25: '🍏',
  score_50: '🔥',
  score_100: '💯',
  games_10: '🕹️',
  games_50: '🎯',
  games_100: '👑',
  total_500: '⭐',
  total_2000: '🌟',
  survivor: '⏱️',
};

export default function AchievementsClient() {
  const t = useTranslations('Achievements');
  const [data, setData] = useState<Data | null>(null);
  const [state, setState] = useState<'loading' | 'unauth' | 'ready'>('loading');

  useEffect(() => {
    apiFetch('/api/profile/achievements')
      .then(async (r) => {
        if (r.status === 401) {
          setState('unauth');
          return;
        }
        const d = await r.json();
        setData(d);
        setState('ready');
      })
      .catch(() => setState('unauth'));
  }, []);

  if (state === 'loading') return <p className="opacity-60">…</p>;

  if (state === 'unauth' || !data) {
    return (
      <div className="space-y-3">
        <p className="opacity-80">{t('loginRequired')}</p>
        <Link href="/login" className="inline-block rounded bg-snake px-4 py-2 font-semibold text-white">
          {t('goLogin')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm opacity-70">
        {t('progress', { count: data.unlockedCount, total: data.total })}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {data.items.map((it) => (
          <div
            key={it.code}
            className={`flex flex-col items-center gap-1 rounded-lg border p-4 text-center ${
              it.unlocked
                ? 'border-snake/40 bg-snake/5'
                : 'border-black/10 bg-black/5 opacity-50 grayscale'
            }`}
            title={t(`defs.${it.code}.desc`)}
          >
            <span className="text-3xl leading-none">{ICON[it.code] ?? '🏅'}</span>
            <span className="text-sm font-semibold">{t(`defs.${it.code}.name`)}</span>
            <span className="text-xs opacity-70">{t(`defs.${it.code}.desc`)}</span>
            {!it.unlocked && <span className="mt-1 text-[0.65rem] uppercase opacity-60">{t('locked')}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
