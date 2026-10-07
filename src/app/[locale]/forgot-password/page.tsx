import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/i18n/routing';
import ForgotPasswordClient from '@/components/ForgotPasswordClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth' });
  return buildMetadata({
    locale,
    path: '/forgot-password',
    title: t('forgotTitle'),
    description: t('forgotTitle'),
    index: false,
  });
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Auth' });
  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="mb-6 text-center text-2xl font-bold">{t('forgotTitle')}</h1>
      <ForgotPasswordClient />
    </div>
  );
}
