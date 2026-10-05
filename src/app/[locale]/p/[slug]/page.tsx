import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import { SITE_URL } from '@/lib/seo/metadata';
import JsonLd from '@/components/JsonLd';
import { getCustomPage, type CustomPageData } from '@/lib/customPages';

// URL tuyệt đối (kèm trailing slash) của 1 trang tùy chỉnh.
function pageUrl(locale: Locale, slug: string): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  return `${SITE_URL}${prefix}/p/${slug}/`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getCustomPage(locale, slug);
  if (!page) return { title: 'Not found', robots: { index: false, follow: false } };

  const languages: Record<string, string> = {};
  for (const [loc, s] of Object.entries(page.alternates)) {
    languages[loc] = pageUrl(loc as Locale, s);
  }
  if (page.alternates[routing.defaultLocale]) {
    languages['x-default'] = pageUrl(routing.defaultLocale, page.alternates[routing.defaultLocale]);
  }
  const canonical = pageUrl(locale, page.slug);

  return {
    metadataBase: new URL(SITE_URL),
    title: page.title,
    description: page.metaDescription,
    alternates: { canonical, languages },
    robots:
      page.robots.index && page.robots.follow
        ? undefined
        : { index: page.robots.index, follow: page.robots.follow },
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      url: canonical,
      locale,
      type: 'article',
    },
  };
}

function breadcrumb(locale: Locale, page: CustomPageData, homeLabel: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: homeLabel,
        item: `${SITE_URL}${locale === routing.defaultLocale ? '' : `/${locale}`}/`,
      },
      { '@type': 'ListItem', position: 2, name: page.h1, item: pageUrl(locale, page.slug) },
    ],
  };
}

export default async function CustomPageView({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const page = await getCustomPage(locale, slug);
  if (!page) notFound();

  const nav = await getTranslations({ locale, namespace: 'Nav' });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <JsonLd data={breadcrumb(locale, page, nav('play'))} />
      <h1 className="mb-4 text-3xl font-bold">{page.h1}</h1>
      {page.bodyHtml ? (
        <div className="content-html opacity-80" dangerouslySetInnerHTML={{ __html: page.bodyHtml }} />
      ) : null}
    </div>
  );
}
