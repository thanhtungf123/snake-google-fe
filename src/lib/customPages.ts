import { API_URL } from './api';
import type { Locale } from '@/i18n/routing';

export interface CustomPageData {
  key: string;
  locale: Locale;
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  bodyHtml: string;
  robots: { index: boolean; follow: boolean };
  // { locale: slug } của các bản dịch đã publish (gồm cả trang hiện tại).
  alternates: Record<string, string>;
}

// Đọc 1 trang tùy chỉnh công khai. null nếu không có / chưa publish.
export async function getCustomPage(
  locale: Locale,
  slug: string
): Promise<CustomPageData | null> {
  try {
    const res = await fetch(`${API_URL}/api/pages/${locale}/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60, tags: ['pages'] },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.page ?? null;
  } catch {
    return null;
  }
}

export interface SitemapPageRow {
  key: string;
  locale: Locale;
  slug: string;
  updatedAt: string | null;
}

// Danh sách trang đã publish cho sitemap. Mảng rỗng nếu lỗi.
export async function getCustomPagesForSitemap(): Promise<SitemapPageRow[]> {
  try {
    const res = await fetch(`${API_URL}/api/pages/sitemap`, {
      next: { revalidate: 300, tags: ['pages'] },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.rows ?? [];
  } catch {
    return [];
  }
}
