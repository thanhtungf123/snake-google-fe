import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/i18n/routing';
import StatsClient from '@/components/StatsClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Stats' });
  return buildMetadata({
    locale,
    path: '/stats',
    title: t('title'),
    description: t('title'),
    index: false, // trang cá nhân: noindex
  });
}

export default async function StatsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Stats' });
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{t('title')}</h1>
      <StatsClient />
    </div>
  );
}
