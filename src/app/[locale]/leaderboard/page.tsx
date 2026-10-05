import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import {
  API_URL,
  PERIODS,
  type Period,
  type LeaderboardRow,
} from '@/lib/api';
import LeaderboardList from '@/components/LeaderboardList';
import MyLeaderboardRank from '@/components/MyLeaderboardRank';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo/jsonld';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Leaderboard' });
  return buildMetadata({
    locale,
    path: '/leaderboard',
    title: t('h1'),
    description: t('soon'),
  });
}

const PERIOD_LABEL: Record<Period, { en: string; vi: string }> = {
  day: { en: 'Today', vi: 'Hôm nay' },
  week: { en: 'This week', vi: 'Tuần này' },
  month: { en: 'This month', vi: 'Tháng này' },
  all: { en: 'All time', vi: 'Mọi lúc' },
};

async function fetchLeaderboard(period: Period): Promise<LeaderboardRow[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/leaderboard?period=${period}&limit=20`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.rows ?? [];
  } catch {
    return [];
  }
}

export default async function LeaderboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { locale } = await params;
  const { period: periodRaw } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Leaderboard' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });

  const period: Period =
    periodRaw && PERIODS.includes(periodRaw as Period) ? (periodRaw as Period) : 'all';
  const rows = await fetchLeaderboard(period);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <JsonLd data={breadcrumbJsonLd(locale, nav('play'), { label: t('h1'), path: '/leaderboard' })} />
      <h1 className="mb-4 text-3xl font-bold">{t('h1')}</h1>

      <div className="mb-5 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p}
            href={{ pathname: '/leaderboard', query: p === 'all' ? {} : { period: p } }}
            className={`rounded-full px-3 py-1 text-sm ${
              p === period ? 'bg-snake text-white' : 'bg-black/5 hover:bg-black/10'
            }`}
          >
            {PERIOD_LABEL[p][locale]}
          </Link>
        ))}
      </div>

      <MyLeaderboardRank period={period} />

      <LeaderboardList initialRows={rows} period={period} />
    </div>
  );
}
