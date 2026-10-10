import type { ReactNode } from 'react';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { routing, type Locale } from '@/i18n/routing';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ScoreSavedToast from '@/components/ScoreSavedToast';
import { getSiteSettings } from '@/lib/settings';
import { getNavPages } from '@/lib/customPages';
import '../globals.css';

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Favicon lấy từ cấu hình site (admin đổi được). Không có thì để Next tự xử lý.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  if (!settings.faviconUrl) return {};
  return { icons: { icon: settings.faviconUrl } };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }
  setRequestLocale(locale);
  // Chạy song song (trước đây tuần tự) để giảm TTFB khi render trang.
  const [messages, settings, navPages] = await Promise.all([
    getMessages(),
    getSiteSettings(),
    getNavPages(locale as Locale),
  ]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {PLAUSIBLE_DOMAIN && (
          // Analytics nhẹ, không cookie. Chỉ bật khi có NEXT_PUBLIC_PLAUSIBLE_DOMAIN.
          <Script
            defer
            data-domain={PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col">
            <Nav
              settings={{ siteTitle: settings.siteTitle, logoUrl: settings.logoUrl }}
              customPages={navPages}
            />
            <main className="flex-1">{children}</main>
            <Footer text={settings.footerText} links={settings.footerLinks} />
            <ScoreSavedToast />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
