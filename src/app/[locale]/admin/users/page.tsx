import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import AdminShell from '@/components/admin/AdminShell';
import AdminUsers from '@/components/admin/AdminUsers';

export const metadata: Metadata = {
  title: 'Admin · Người dùng',
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <AdminShell>
      <AdminUsers />
    </AdminShell>
  );
}
