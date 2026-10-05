import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import AdminShell from '@/components/admin/AdminShell';
import AdminPages from '@/components/admin/AdminPages';

export const metadata: Metadata = {
  title: 'Admin · Trang tùy chỉnh',
  robots: { index: false, follow: false },
};

export default async function AdminPagesRoute({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <AdminShell>
      <AdminPages />
    </AdminShell>
  );
}
