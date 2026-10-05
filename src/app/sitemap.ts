import type { MetadataRoute } from 'next';
import { getPathname, routing, type Pathnames } from '@/i18n/routing';

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

export default function sitemap(): MetadataRoute.Sitemap {
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

  return entries;
}
