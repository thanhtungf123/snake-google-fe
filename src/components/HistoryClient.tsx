'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { apiFetch } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/Skeleton';

interface Game {
  id: string;
  score: number;
  durationMs: number;
  status: 'valid' | 'flagged' | 'rejected';
  playedAt: string | null;
}

type Filter = 'all' | 'valid' | 'flagged' | 'rejected';
const FILTERS: Filter[] = ['all', 'valid', 'flagged', 'rejected'];
const PAGE = 20;

export default function HistoryClient() {
  const t = useTranslations('History');
  const locale = useLocale();
  const [rows, setRows] = useState<Game[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');
  const [state, setState] = useState<'loading' | 'unauth' | 'ready'>('loading');
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (f: Filter, skip: number) => {
      const qs = new URLSearchParams({ skip: String(skip), limit: String(PAGE) });
      if (f !== 'all') qs.set('status', f);
      const r = await apiFetch(`/api/profile/history?${qs.toString()}`);
      if (r.status === 401) {
        setState('unauth');
        return null;
      }
      const d = await r.json();
      setTotal(d.total ?? 0);
      setState('ready');
      return d.rows as Game[];
    },
    []
  );

  useEffect(() => {
    fetchPage(filter, 0)
      .then((r) => {
        if (r) setRows(r);
      })
      .catch(() => setState('unauth'));
  }, [filter, fetchPage]);

  async function loadMore() {
    setLoadingMore(true);
    const more = await fetchPage(filter, rows.length).catch(() => null);
    if (more) setRows((prev) => [...prev, ...more]);
    setLoadingMore(false);
  }

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US') : '—';
  const fmtDur = (ms: number) => `${Math.round(ms / 1000)}s`;

  if (state === 'loading')
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <div key={f} className="skeleton h-7 w-16 rounded-full" aria-hidden="true" />
          ))}
        </div>
        <TableSkeleton rows={8} />
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

  const statusLabel = (s: Game['status']) =>
    s === 'valid' ? t('valid') : s === 'flagged' ? t('flagged') : t('rejected');
  const statusColor = (s: Game['status']) =>
    s === 'valid' ? 'text-green-600' : s === 'flagged' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-sm ${
              f === filter ? 'bg-snake text-white' : 'bg-black/5 hover:bg-black/10'
            }`}
          >
            {t(f)}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="opacity-70">{t('empty')}</p>
      ) : (
        <>
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 opacity-60">
                <th className="py-2 pr-4">{t('score')}</th>
                <th className="py-2 pr-4">{t('duration')}</th>
                <th className="py-2 pr-4">{t('status')}</th>
                <th className="py-2 text-right">{t('playedAt')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id} className="border-b border-black/5">
                  <td className="py-2 pr-4 font-semibold tabular-nums">{g.score}</td>
                  <td className="py-2 pr-4 tabular-nums opacity-70">{fmtDur(g.durationMs)}</td>
                  <td className={`py-2 pr-4 ${statusColor(g.status)}`}>{statusLabel(g.status)}</td>
                  <td className="py-2 text-right opacity-60">{fmtDate(g.playedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between pt-2 text-sm opacity-70">
            <span>{t('showing', { count: rows.length, total })}</span>
            {rows.length < total && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded bg-black/5 px-4 py-2 hover:bg-black/10 disabled:opacity-50"
              >
                {t('loadMore')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
