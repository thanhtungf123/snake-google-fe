import type { ReactNode } from 'react';
import { setRequestLocale } from 'next-intl/server';
import AdminShell from '@/components/admin/AdminShell';

// Layout dùng chung cho mọi route /admin/* — giữ AdminShell (sidebar/topbar, kiểm tra
// quyền, theme) không bị mount lại khi chuyển tab, nên đổi tab là điều hướng client
// (không reload toàn trang, không nháy header site công khai).
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminShell>{children}</AdminShell>;
}
