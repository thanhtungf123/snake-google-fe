import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/i18n/routing';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo/jsonld';
import { getPageContent, seoFromContent } from '@/lib/content';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'HowToPlay' });
  const c = await getPageContent('how-to-play', locale);
  return buildMetadata({
    locale,
    path: '/how-to-play',
    title: c?.seoTitle || t('h1'),
    description: c?.metaDescription || t('body'),
    ...seoFromContent(c),
  });
}

export default async function HowToPlayPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'HowToPlay' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });
  const c = await getPageContent('how-to-play', locale);
  const h1 = c?.h1 || t('h1');
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <JsonLd data={breadcrumbJsonLd(locale, nav('play'), { label: h1, path: '/how-to-play' })} />
      <h1 className="mb-4 text-3xl font-bold">{h1}</h1>
      {c?.bodyHtml ? (
        <div className="content-html opacity-80" dangerouslySetInnerHTML={{ __html: c.bodyHtml }} />
      ) : (
        <p className="opacity-80">{t('body')}</p>
      )}
    </div>
  );
}
