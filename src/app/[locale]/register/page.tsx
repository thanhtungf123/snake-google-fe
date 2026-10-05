import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/i18n/routing';
import AuthForm from '@/components/AuthForm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth' });
  return buildMetadata({
    locale,
    path: '/register',
    title: t('registerTitle'),
    description: t('registerTitle'),
    index: false,
  });
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Auth' });
  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="mb-6 text-center text-2xl font-bold">{t('registerTitle')}</h1>
      <AuthForm mode="register" />
    </div>
  );
}
