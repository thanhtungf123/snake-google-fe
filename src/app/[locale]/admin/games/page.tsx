import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import AdminShell from '@/components/admin/AdminShell';
import AdminGames from '@/components/admin/AdminGames';

export const metadata: Metadata = {
  title: 'Admin · Game',
  robots: { index: false, follow: false },
};

export default async function AdminGamesRoute({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <AdminShell>
      <AdminGames />
    </AdminShell>
  );
}
