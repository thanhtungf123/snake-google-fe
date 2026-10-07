'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';

interface SeasonMeta {
  monthKey: string;
  status: 'open' | 'closed';
  closedAt: string | null;
  isCurrent: boolean;
}
interface Entry {
  rank: number;
  userId: string;
  nickname: string;
  best: number;
}
interface Board {
  monthKey: string;
  status: 'open' | 'closed';
  frozen: boolean;
  rewardTiers: number;
  total: number;
  rows: Entry[];
}
interface MyRank {
  rank: number | null;
  best: number | null;
}

const PAGE = 20;

export default function SeasonBoard() {
  const t = useTranslations('Leaderboard');
  const [seasons, setSeasons] = useState<SeasonMeta[]>([]);
  const [month, setMonth] = useState<string>('');
  const [board, setBoard] = useState<Board | null>(null);
  const [my, setMy] = useState<MyRank | null>(null);
  const [loading, setLoading] = useState(false);

  // Nạp danh sách tháng khi mount.
  useEffect(() => {
    apiFetch('/api/leaderboard/seasons')
      .then((r) => r.json())
      .then((d: { current: string; seasons: SeasonMeta[] }) => {
        setSeasons(d.seasons ?? []);
        setMonth(d.current);
      })
      .catch(() => {});
  }, []);

  const loadBoard = useCallback((m: string) => {
    if (!m) return;
    setLoading(true);
    Promise.all([
      apiFetch(`/api/leaderboard/season?month=${m}&limit=${PAGE}`).then((r) => r.json()),
      apiFetch(`/api/leaderboard/season/me?month=${m}`).then((r) => r.json()),
    ])
      .then(([b, me]) => {
        setBoard(b);
        setMy({ rank: me.rank ?? null, best: me.best ?? null });
      })
      .catch(() => setBoard(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (month) loadBoard(month);
  }, [month, loadBoard]);

  async function loadMore() {
    if (!board) return;
    setLoading(true);
    try {
      const r = await apiFetch(
        `/api/leaderboard/season?month=${board.monthKey}&limit=${PAGE}&skip=${board.rows.length}`
      );
      const more: Board = await r.json();
      setBoard({ ...board, rows: [...board.rows, ...more.rows] });
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  const hasMore = board ? board.rows.length < board.total : false;

  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">{t('seasonTitle')}</h2>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded border border-black/15 px-3 py-1.5 text-sm"
        >
          {seasons.map((s) => (
            <option key={s.monthKey} value={s.monthKey}>
              {s.monthKey}
              {s.isCurrent ? ` · ${t('seasonCurrent')}` : ''}
            </option>
          ))}
        </select>
      </div>

      {board && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <span
            className={`rounded-full px-2.5 py-0.5 ${
              board.status === 'closed'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {board.status === 'closed' ? t('seasonClosed') : t('seasonOpen')}
          </span>
          <span className="opacity-60">{t('seasonRewardNote', { n: board.rewardTiers })}</span>
        </div>
      )}

      {my && my.rank !== null && (
        <p className="mb-3 rounded bg-snake/10 px-3 py-2 text-sm">
          {t('yourRank', { rank: my.rank, best: my.best ?? 0 })}
        </p>
      )}

      {!board || board.rows.length === 0 ? (
        <p className="opacity-70">{loading ? '…' : t('seasonEmpty')}</p>
      ) : (
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
              {board.rows.map((r) => {
                const rewarded = r.rank <= board.rewardTiers;
                return (
                  <tr
                    key={r.userId}
                    className={`border-b border-black/5 ${rewarded ? 'bg-snake/5 font-semibold' : ''}`}
                  >
                    <td className="py-2 pr-4">
                      {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}
                      {rewarded && r.rank > 3 && ' 🎁'}
                    </td>
                    <td className="py-2 pr-4">{r.nickname}</td>
                    <td className="py-2 text-right tabular-nums">{r.best}</td>
                  </tr>
                );
              })}
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
      )}
    </section>
  );
}
