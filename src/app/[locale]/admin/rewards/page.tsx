import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import AdminShell from '@/components/admin/AdminShell';
import AdminRewards from '@/components/admin/AdminRewards';

export const metadata: Metadata = {
  title: 'Admin · Nhận thưởng',
  robots: { index: false, follow: false },
};

export default async function AdminRewardsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <AdminShell>
      <AdminRewards />
    </AdminShell>
  );
}
