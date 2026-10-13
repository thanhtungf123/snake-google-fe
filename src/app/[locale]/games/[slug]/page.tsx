import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, routing, getPathname, type Locale } from '@/i18n/routing';
import { SITE_URL } from '@/lib/seo/metadata';
import JsonLd from '@/components/JsonLd';
import GameEmbed from '@/components/game/GameEmbed';
import GameCard from '@/components/game/GameCard';
import { getGame } from '@/lib/games';

// URL tuyệt đối (kèm trailing slash) của 1 game theo ngôn ngữ.
function gameUrl(locale: Locale, slug: string): string {
  const p = getPathname({ href: { pathname: '/games/[slug]', params: { slug } }, locale });
  const withSlash = p.endsWith('/') ? p : `${p}/`;
  return `${SITE_URL}${withSlash}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getGame(locale, slug);
  if (!data) return { title: 'Not found', robots: { index: false, follow: false } };
  const { game } = data;

  const languages: Record<string, string> = {};
  for (const [loc, s] of Object.entries(game.alternates)) {
    languages[loc] = gameUrl(loc as Locale, s);
  }
  if (game.alternates[routing.defaultLocale]) {
    languages['x-default'] = gameUrl(routing.defaultLocale, game.alternates[routing.defaultLocale]);
  }
  const canonical = gameUrl(locale, game.slug);

  return {
    metadataBase: new URL(SITE_URL),
    title: game.title,
    description: game.metaDescription,
    alternates: { canonical, languages },
    robots:
      game.robots.index && game.robots.follow
        ? undefined
        : { index: game.robots.index, follow: game.robots.follow },
    openGraph: {
      title: game.title,
      description: game.metaDescription,
      url: canonical,
      locale,
      type: 'article',
      ...(game.thumbnailUrl ? { images: [game.thumbnailUrl] } : {}),
    },
  };
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const data = await getGame(locale, slug);
  if (!data) notFound();
  const { game, related } = data;
  const t = await getTranslations({ locale, namespace: 'Games' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });

  const homeUrl = `${SITE_URL}${locale === routing.defaultLocale ? '' : `/${locale}`}/`;
  const allGamesUrl =
    SITE_URL +
    (() => {
      const p = getPathname({ href: '/all-games', locale });
      return p.endsWith('/') ? p : `${p}/`;
    })();

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: nav('play'), item: homeUrl },
      { '@type': 'ListItem', position: 2, name: t('h1'), item: allGamesUrl },
      { '@type': 'ListItem', position: 3, name: game.h1, item: gameUrl(locale, game.slug) },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <JsonLd data={breadcrumb} />
      <Link href="/all-games" className="mb-3 inline-block text-sm text-snake hover:underline">
        {t('backToAll')}
      </Link>

      {game.embedUrl ? (
        <GameEmbed
          embedUrl={game.embedUrl}
          title={game.h1}
          aspectW={game.aspectW}
          aspectH={game.aspectH}
        />
      ) : (
        <p className="rounded border border-black/10 bg-black/[0.03] px-4 py-6 text-center opacity-60">
          {t('noEmbed')}
        </p>
      )}

      {/* H1 nằm DƯỚI khung game (theo yêu cầu bố cục). */}
      <h1 className="mb-4 mt-6 text-3xl font-bold">{game.h1}</h1>

      {game.bodyHtml ? (
        <div
          className="content-html mt-6 opacity-80"
          dangerouslySetInnerHTML={{ __html: game.bodyHtml }}
        />
      ) : null}

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">{t('related')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((g) => (
              <GameCard key={g.key} game={g} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
