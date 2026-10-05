import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import AdminShell from '@/components/admin/AdminShell';
import AdminScores from '@/components/admin/AdminScores';

export const metadata: Metadata = {
  title: 'Admin · Điểm',
  robots: { index: false, follow: false },
};

export default async function AdminScoresPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <AdminShell>
      <AdminScores />
    </AdminShell>
  );
}
