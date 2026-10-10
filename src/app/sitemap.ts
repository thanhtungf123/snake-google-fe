import type { MetadataRoute } from 'next';
import { getPathname, routing, type Pathnames, type Locale } from '@/i18n/routing';
import { getCustomPagesForSitemap } from '@/lib/customPages';
import { SITE_URL } from '@/lib/seo/metadata';

const BASE = SITE_URL;

// Chỉ các trang public được index (không gồm login/register/profile...)
const INDEXABLE: Pathnames[] = [
  '/',
  '/leaderboard',
  '/rewards',
];

function withSlash(p: string): string {
  if (p === '/') return '/';
  return p.endsWith('/') ? p : `${p}/`;
}

function customPageUrl(locale: Locale, slug: string): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  return `${BASE}${prefix}/${slug}/`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of INDEXABLE) {
    const languages: Record<string, string> = {};
    for (const locale of routing.locales) {
      languages[locale] = BASE + withSlash(getPathname({ href: path, locale }));
    }
    languages['x-default'] = BASE + withSlash(getPathname({ href: path, locale: routing.defaultLocale }));

    // Cả URL EN và VI đều được đưa vào sitemap XML theo Mục III Kế hoạch v3
    for (const locale of routing.locales) {
      entries.push({
        url: BASE + withSlash(getPathname({ href: path, locale })),
        lastModified: new Date(),
        alternates: { languages },
      });
    }
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
    const defaultPage = list.find((it) => it.locale === routing.defaultLocale);
    if (defaultPage) {
      languages['x-default'] = customPageUrl(routing.defaultLocale, defaultPage.slug);
    }
    const lastModified = list
      .map((it) => it.updatedAt)
      .filter(Boolean)
      .sort()
      .pop();

    for (const it of list) {
      entries.push({
        url: customPageUrl(it.locale, it.slug),
        lastModified: it.updatedAt ? new Date(it.updatedAt) : lastModified ? new Date(lastModified) : new Date(),
        alternates: { languages },
      });
    }
  }

  return entries;
}
