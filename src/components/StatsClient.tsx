'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { apiFetch } from '@/lib/api';
import { StatTilesSkeleton, TableSkeleton } from '@/components/ui/Skeleton';

interface Bucket {
  from: number | string;
  count: number;
}
interface TrendPoint {
  score: number;
  at: string | null;
}
interface PeriodStat {
  games: number;
  best: number;
  totalScore: number;
}
interface Stats {
  totalGames: number;
  totalScore: number;
  best: number;
  avg: number;
  totalDurationMs: number;
  longestGameMs: number;
  periods: { day: PeriodStat; week: PeriodStat; month: PeriodStat };
  distribution: Bucket[];
  trend: TrendPoint[];
}

function fmtDuration(ms: number): string {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const h = Math.floor(min / 60);
  if (h > 0) return `${h}h ${min % 60}m`;
  return `${min}m ${sec % 60}s`;
}

const BUCKET_LABEL: Record<string, string> = {
  '0': '0–4',
  '5': '5–9',
  '10': '10–19',
  '20': '20–29',
  '30': '30–49',
  '50': '50+',
  other: '?',
};

export default function StatsClient() {
  const t = useTranslations('Stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [state, setState] = useState<'loading' | 'unauth' | 'ready'>('loading');

  useEffect(() => {
    apiFetch('/api/profile/stats')
      .then(async (r) => {
        if (r.status === 401) {
          setState('unauth');
          return;
        }
        const d = await r.json();
        setStats(d.stats);
        setState('ready');
      })
      .catch(() => setState('unauth'));
  }, []);

  if (state === 'loading')
    return (
      <div className="space-y-8">
        <StatTilesSkeleton count={6} />
        <TableSkeleton rows={4} />
      </div>
    );

  if (state === 'unauth' || !stats) {
    return (
      <div className="space-y-3">
        <p className="opacity-80">{t('loginRequired')}</p>
        <Link href="/login" className="inline-block rounded bg-snake px-4 py-2 font-semibold text-white">
          {t('goLogin')}
        </Link>
      </div>
    );
  }

  if (stats.totalGames === 0) {
    return <p className="opacity-70">{t('empty')}</p>;
  }

  const maxBucket = Math.max(1, ...stats.distribution.map((b) => b.count));
  const trendMax = Math.max(1, ...stats.trend.map((p) => p.score));

  return (
    <div className="animate-fade-in space-y-8">
      <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
        <Stat label={t('totalGames')} value={stats.totalGames} />
        <Stat label={t('best')} value={stats.best} />
        <Stat label={t('avg')} value={stats.avg} />
        <Stat label={t('totalScore')} value={stats.totalScore} />
        <Stat label={t('timePlayed')} value={fmtDuration(stats.totalDurationMs)} />
        <Stat label={t('longestGame')} value={fmtDuration(stats.longestGameMs)} />
      </div>

      {/* Tách theo kỳ: hôm nay / tuần này / tháng này */}
      <div>
        <h3 className="mb-2 text-lg font-semibold">{t('byPeriod')}</h3>
        <div className="overflow-hidden rounded-lg border border-black/10">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left">
              <tr>
                <th className="px-3 py-2 font-medium opacity-70" />
                <th className="px-3 py-2 text-right font-medium opacity-70">{t('periodGames')}</th>
                <th className="px-3 py-2 text-right font-medium opacity-70">{t('periodBest')}</th>
                <th className="px-3 py-2 text-right font-medium opacity-70">{t('periodTotal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {(['day', 'week', 'month'] as const).map((key) => (
                <tr key={key}>
                  <td className="px-3 py-2 font-medium">{t(key)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{stats.periods[key].games}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{stats.periods[key].best}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{stats.periods[key].totalScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trend */}
      {stats.trend.length > 1 && (
        <div>
          <h3 className="mb-2 text-lg font-semibold">{t('trend')}</h3>
          <div className="flex h-28 items-end gap-1 rounded-lg bg-black/5 p-3">
            {stats.trend.map((p, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-snake"
                style={{ height: `${Math.max(4, (p.score / trendMax) * 100)}%` }}
                title={`${p.score}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Distribution */}
      <div>
        <h3 className="mb-2 text-lg font-semibold">{t('distribution')}</h3>
        <div className="space-y-1">
          {stats.distribution.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-14 shrink-0 tabular-nums opacity-60">
                {BUCKET_LABEL[String(b.from)] ?? String(b.from)}
              </span>
              <div className="h-4 flex-1 rounded bg-black/5">
                <div
                  className="h-4 rounded bg-snake"
                  style={{ width: `${(b.count / maxBucket) * 100}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right tabular-nums">{b.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-black/5 p-4">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs opacity-60">{label}</div>
    </div>
  );
}
