import { API_URL } from './api';
import type { Locale } from '@/i18n/routing';

export type PageKey = 'home' | 'how-to-play' | 'rewards' | 'about';

export interface PageContent {
  pageKey: PageKey;
  locale: Locale;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  bodyHtml: string;
  canonicalOverride: string | null;
  robots: { index: boolean; follow: boolean };
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
}

// Gom các trường SEO (robots/canonical/OG) từ content DB để truyền vào buildMetadata.
// Dùng mặc định an toàn khi chưa có bản ghi.
export function seoFromContent(c: PageContent | null) {
  return {
    index: c?.robots?.index ?? true,
    follow: c?.robots?.follow ?? true,
    canonicalOverride: c?.canonicalOverride ?? null,
    ogTitle: c?.ogTitle ?? null,
    ogDescription: c?.ogDescription ?? null,
    ogImage: c?.ogImage ?? null,
  };
}

// Đọc nội dung trang từ backend (DB). Trả null nếu chưa có / lỗi — khi đó
// trang dùng text mặc định từ i18n (fallback).
export async function getPageContent(
  pageKey: PageKey,
  locale: Locale
): Promise<PageContent | null> {
  try {
    // ISR: trang SEO vẫn được cache/nhanh, nhưng tự cập nhật nội dung admin trong ~60s.
    const res = await fetch(`${API_URL}/api/content/${pageKey}/${locale}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.content ?? null;
  } catch {
    return null;
  }
}
