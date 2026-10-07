import { API_URL } from './api';

export interface SiteSettings {
  siteTitle: string;
  logoUrl: string;
  faviconUrl: string;
  footerText: string;
}

const EMPTY: SiteSettings = { siteTitle: '', logoUrl: '', faviconUrl: '', footerText: '' };

// Đọc cấu hình site từ backend. Timeout 5s + fallback rỗng để không treo lúc build.
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_URL}/api/settings`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return EMPTY;
    const data = await res.json();
    return { ...EMPTY, ...(data.settings ?? {}) };
  } catch {
    return EMPTY;
  }
}
