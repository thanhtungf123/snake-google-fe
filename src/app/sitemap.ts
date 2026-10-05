import type { MetadataRoute } from 'next';
import { getPathname, routing, type Pathnames, type Locale } from '@/i18n/routing';
import { getCustomPagesForSitemap } from '@/lib/customPages';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Chỉ các trang public được index (không gồm login/register/profile...)
const INDEXABLE: Pathnames[] = [
  '/',
  '/leaderboard',
  '/how-to-play',
  '/rewards',
  '/about',
];

function withSlash(p: string): string {
  if (p === '/') return '/';
  return p.endsWith('/') ? p : `${p}/`;
}

function customPageUrl(locale: Locale, slug: string): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  return `${BASE}${prefix}/p/${slug}/`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of INDEXABLE) {
    const languages: Record<string, string> = {};
    for (const locale of routing.locales) {
      languages[locale] = BASE + withSlash(getPathname({ href: path, locale }));
    }
    // URL EN làm bản chính, kèm alternates hreflang.
    entries.push({
      url: BASE + withSlash(getPathname({ href: path, locale: 'en' })),
      lastModified: new Date(),
      alternates: { languages },
    });
  }

  // Các trang tùy chỉnh đã publish — gom theo key để dựng hreflang.
  const rows = await getCustomPagesForSitemap();
  const byKey = new Map<string, { locale: Locale; slug: string; updatedAt: string | null }[]>();
  for (const r of rows) {
    const list = byKey.get(r.key) ?? [];
    list.push({ locale: r.locale, slug: r.slug, updatedAt: r.updatedAt });
    byKey.set(r.key, list);
  }
  for (const list of byKey.values()) {
    const languages: Record<string, string> = {};
    for (const it of list) languages[it.locale] = customPageUrl(it.locale, it.slug);
    // Ưu tiên bản EN làm URL chính, nếu không có thì lấy bản đầu tiên.
    const main = list.find((it) => it.locale === routing.defaultLocale) ?? list[0];
    const lastModified = list
      .map((it) => it.updatedAt)
      .filter(Boolean)
      .sort()
      .pop();
    entries.push({
      url: customPageUrl(main.locale, main.slug),
      lastModified: lastModified ? new Date(lastModified) : new Date(),
      alternates: { languages },
    });
  }

  return entries;
}
