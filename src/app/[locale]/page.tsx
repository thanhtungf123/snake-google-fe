import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/i18n/routing';
import RankedGameEmbed from '@/components/game/RankedGameEmbed';
import HomeTopBoard from '@/components/HomeTopBoard';
import { getPageContent, seoFromContent } from '@/lib/content';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Home' });
  const c = await getPageContent('home', locale);
  return buildMetadata({
    locale,
    path: '/',
    title: c?.seoTitle || t('title'),
    description: c?.metaDescription || t('intro'),
    ...seoFromContent(c),
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Home' });
  const c = await getPageContent('home', locale);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-2 text-center text-3xl font-bold">{t('h1')}</h1>
      <p className="mx-auto mb-6 max-w-2xl text-center opacity-80">
        {t('intro')}
      </p>

      <RankedGameEmbed />

      <HomeTopBoard locale={locale} />

      <section className="mx-auto mt-10 max-w-2xl">
        <h2 className="mb-2 text-xl font-semibold">{c?.h1 || t('seoHeading')}</h2>
        {c?.bodyHtml ? (
          <div className="content-html opacity-80" dangerouslySetInnerHTML={{ __html: c.bodyHtml }} />
        ) : (
          <p className="opacity-80">{t('seoBody')}</p>
        )}
      </section>
    </div>
  );
}
