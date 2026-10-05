import { SITE_URL, absoluteUrl } from './metadata';
import type { Pathnames, Locale } from '@/i18n/routing';

// --- Các builder structured data (schema.org) ---

// WebSite + SearchAction cho trang chủ.
export function websiteJsonLd(locale: Locale, name: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    description,
    url: absoluteUrl('/', locale),
    inLanguage: locale,
  };
}

// VideoGame cho trang chơi game (trang chủ).
export function gameJsonLd(locale: Locale, name: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name,
    description,
    url: absoluteUrl('/', locale),
    inLanguage: locale,
    applicationCategory: 'Game',
    operatingSystem: 'Web browser',
    genre: 'Arcade',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
}

// BreadcrumbList: Trang chủ > <trang hiện tại>.
export function breadcrumbJsonLd(
  locale: Locale,
  homeLabel: string,
  current: { label: string; path: Pathnames }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: homeLabel,
        item: absoluteUrl('/', locale),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: current.label,
        item: absoluteUrl(current.path, locale),
      },
    ],
  };
}

export { SITE_URL };
