import { getTranslations } from 'next-intl/server';
import { Link, type Locale } from '@/i18n/routing';
import { API_URL, type LeaderboardRow } from '@/lib/api';

async function fetchTop(limit: number): Promise<LeaderboardRow[]> {
  try {
    const res = await fetch(`${API_URL}/api/leaderboard?period=all&limit=${limit}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.rows ?? [];
  } catch {
    return [];
  }
}

// Bảng xếp hạng rút gọn (Top 5) cho trang chủ — render phía server (SEO).
export default async function HomeTopBoard({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Leaderboard' });
  const rows = await fetchTop(5);
  if (rows.length === 0) return null;

  return (
    <section className="mx-auto mt-10 max-w-md">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">{t('topTitle')}</h2>
        <Link href="/leaderboard" className="text-sm text-snake hover:underline">
          {t('viewAll')} →
        </Link>
      </div>
      <ol className="divide-y divide-black/10 rounded-lg border border-black/10">
        {rows.map((r) => (
          <li key={r.userId} className="flex items-center justify-between px-4 py-2">
            <span className="flex items-center gap-2">
              <span className="w-6 text-center">
                {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}
              </span>
              <span className={r.rank <= 3 ? 'font-semibold' : ''}>{r.nickname}</span>
            </span>
            <span className="tabular-nums">{r.best}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
