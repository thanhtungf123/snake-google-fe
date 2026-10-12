import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';
import GameCard from '@/components/game/GameCard';
import { getGamesCatalog } from '@/lib/games';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Games' });
  const catalog = await getGamesCatalog(locale);
  const idx = catalog?.index;
  return buildMetadata({
    locale,
    path: '/all-games',
    title: idx?.title || t('title'),
    description: idx?.metaDescription || t('intro'),
    index: idx?.robots.index ?? true,
    follow: idx?.robots.follow ?? true,
  });
}

export default async function AllGamesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Games' });
  const catalog = await getGamesCatalog(locale);

  const h1 = catalog?.index.h1 || t('h1');
  const introHtml = catalog?.index.introHtml || '';
  const games = catalog?.games ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-3 text-3xl font-bold">{h1}</h1>
      {introHtml ? (
        <div
          className="content-html mb-6 max-w-3xl opacity-80"
          dangerouslySetInnerHTML={{ __html: introHtml }}
        />
      ) : (
        <p className="mb-6 max-w-3xl opacity-80">{t('intro')}</p>
      )}

      {games.length === 0 ? (
        <p className="opacity-60">{t('empty')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <GameCard key={g.key} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}
