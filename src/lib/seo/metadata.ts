import type { Metadata } from 'next';
import { getPathname, routing, type Pathnames, type Locale } from '@/i18n/routing';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

function withTrailingSlash(p: string): string {
  if (p === '/') return '/';
  return p.endsWith('/') ? p : `${p}/`;
}

function absolute(path: Pathnames, locale: Locale): string {
  const p = getPathname({ href: path, locale });
  return BASE + withTrailingSlash(p);
}

export function buildMetadata(opts: {
  locale: Locale;
  path: Pathnames;
  title: string;
  description: string;
  index?: boolean;
  follow?: boolean;
  canonicalOverride?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
}): Metadata {
  const {
    locale,
    path,
    title,
    description,
    index = true,
    follow = true,
    canonicalOverride,
    ogTitle,
    ogDescription,
    ogImage,
  } = opts;

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = absolute(path, l);
  }
  languages['x-default'] = absolute(path, routing.defaultLocale);

  const canonical = canonicalOverride || absolute(path, locale);

  return {
    metadataBase: new URL(BASE),
    title,
    description,
    alternates: { canonical, languages },
    // Mặc định index+follow → để Next tự xuất; khác mặc định mới ghi robots.
    robots: index && follow ? undefined : { index, follow },
    openGraph: {
      title: ogTitle || title,
      description: ogDescription || description,
      url: canonical,
      locale,
      type: 'website',
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}
