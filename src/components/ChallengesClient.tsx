'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { apiFetch } from '@/lib/api';

interface Challenge {
  code: string;
  period: 'daily' | 'weekly';
  metric: string;
  target: number;
  progress: number;
  completed: boolean;
}
interface Data {
  daily: Challenge[];
  weekly: Challenge[];
}

export default function ChallengesClient() {
  const t = useTranslations('Challenges');
  const [data, setData] = useState<Data | null>(null);
  const [state, setState] = useState<'loading' | 'unauth' | 'ready'>('loading');

  useEffect(() => {
    apiFetch('/api/profile/challenges')
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
    <div className="space-y-8">
      <Section title={t('daily')} items={data.daily} t={t} />
      <Section title={t('weekly')} items={data.weekly} t={t} />
    </div>
  );
}

function Section({
  title,
  items,
  t,
}: {
  title: string;
  items: Challenge[];
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div>
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>
      <ul className="space-y-3">
        {items.map((c) => {
          const pct = Math.min(100, Math.round((c.progress / c.target) * 100));
          return (
            <li
              key={c.code}
              className={`rounded-lg border p-3 ${
                c.completed ? 'border-snake/40 bg-snake/5' : 'border-black/10'
              }`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-medium">
                  {c.completed && '✅ '}
                  {t(`defs.${c.code}.name`)}
                </span>
                <span className="shrink-0 text-sm tabular-nums opacity-70">
                  {c.completed ? t('done') : `${c.progress}/${c.target}`}
                </span>
              </div>
              <div className="h-2 rounded bg-black/10">
                <div
                  className="h-2 rounded bg-snake transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
