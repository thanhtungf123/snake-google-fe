'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiFetch, type LeaderboardRow, type Period } from '@/lib/api';

const PAGE = 20;

export default function LeaderboardList({
  initialRows,
  period,
}: {
  initialRows: LeaderboardRow[];
  period: Period;
}) {
  const t = useTranslations('Leaderboard');
  const [rows, setRows] = useState<LeaderboardRow[]>(initialRows);
  const [hasMore, setHasMore] = useState(initialRows.length === PAGE);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/leaderboard?period=${period}&limit=${PAGE}&skip=${rows.length}`);
      const data = await res.json();
      const more: LeaderboardRow[] = data.rows ?? [];
      setRows((prev) => [...prev, ...more]);
      setHasMore(more.length === PAGE);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  if (rows.length === 0) {
    return <p className="opacity-70">{t('soon')}</p>;
  }

  return (
    <>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-black/10 text-sm opacity-60">
            <th className="py-2 pr-4">{t('rank')}</th>
            <th className="py-2 pr-4">{t('player')}</th>
            <th className="py-2 text-right">{t('points')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.userId}
              className={`border-b border-black/5 ${r.rank <= 3 ? 'font-semibold' : ''}`}
            >
              <td className="py-2 pr-4">
                {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}
              </td>
              <td className="py-2 pr-4">{r.nickname}</td>
              <td className="py-2 text-right tabular-nums">{r.best}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded bg-black/5 px-5 py-2 text-sm hover:bg-black/10 disabled:opacity-50"
          >
            {t('loadMore')}
          </button>
        </div>
      )}
    </>
  );
}
