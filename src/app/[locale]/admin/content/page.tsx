import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import AdminShell from '@/components/admin/AdminShell';
import AdminContent from '@/components/admin/AdminContent';

export const metadata: Metadata = {
  title: 'Admin · Nội dung',
  robots: { index: false, follow: false },
};

export default async function AdminContentPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <AdminShell>
      <AdminContent />
    </AdminShell>
  );
}
