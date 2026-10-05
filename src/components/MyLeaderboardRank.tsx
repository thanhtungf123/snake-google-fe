'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiFetch, type Period } from '@/lib/api';

interface MeRank {
  rank: number | null;
  best: number | null;
  nickname?: string;
}

// Banner "vị trí của bạn" — chỉ hiện khi đã đăng nhập.
export default function MyLeaderboardRank({ period }: { period: Period }) {
  const t = useTranslations('Leaderboard');
  const [data, setData] = useState<MeRank | null>(null);

  useEffect(() => {
    apiFetch(`/api/leaderboard/me?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, [period]);

  // Chưa tải xong, hoặc không đăng nhập (không có nickname) → không hiện gì.
  if (!data || !data.nickname) return null;

  return (
    <div className="mb-5 rounded-lg bg-snake/10 px-4 py-3 text-sm">
      <span className="font-medium">{t('yourPosition')}: </span>
      {data.rank ? (
        <span>{t('yourRank', { rank: data.rank, best: data.best ?? 0 })}</span>
      ) : (
        <span className="opacity-80">{t('notRanked')}</span>
      )}
    </div>
  );
}
