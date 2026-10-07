import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import AdminShell from '@/components/admin/AdminShell';
import AdminSettings from '@/components/admin/AdminSettings';

export const metadata: Metadata = {
  title: 'Admin · Cấu hình',
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <AdminShell>
      <AdminSettings />
    </AdminShell>
  );
}
