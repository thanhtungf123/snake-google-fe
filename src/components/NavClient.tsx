'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import NextLink from 'next/link';
import { Link, useRouter } from '@/i18n/routing';
import { apiFetch } from '@/lib/api';
import { AUTH_EVENT } from './AuthNav';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from './LanguageSwitcher';

interface Me {
  nickname: string;
  isGuest: boolean;
  role?: 'user' | 'admin';
}

interface BrandSettings {
  siteTitle?: string;
  logoUrl?: string;
}

export interface NavPage {
  slug: string;
  label: string;
}

// Các trang điều hướng công khai cố định (trái). Các trang tùy chỉnh đã publish được
// thêm động từ prop `customPages`.
const NAV_LINKS = [{ href: '/leaderboard', key: 'leaderboard' }] as const;

const ACCOUNT_LINKS = [
  { href: '/profile', key: 'profile' },
  { href: '/stats', key: 'stats' },
  { href: '/history', key: 'history' },
  { href: '/achievements', key: 'achievements' },
  { href: '/challenges', key: 'challenges' },
  { href: '/my-rewards', key: 'myRewards' },
  { href: '/account', key: 'accountSettings' },
] as const;

export default function NavClient({
  settings,
  customPages = [],
}: {
  settings?: BrandSettings;
  customPages?: NavPage[];
}) {
  const t = useTranslations('Nav');
  const locale = useLocale();
  const router = useRouter();
  const title = settings?.siteTitle?.trim() || 'Snake';

  // URL trang tùy chỉnh ở gốc (không /p/), kèm prefix /vi cho tiếng Việt + trailing slash.
  const pageHref = (slug: string) => `${locale === 'en' ? '' : '/vi'}/${slug}/`;

  const [user, setUser] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const accountRef = useRef<HTMLDivElement | null>(null);
  const mobileRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(() => {
    apiFetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(AUTH_EVENT, load);
    return () => window.removeEventListener(AUTH_EVENT, load);
  }, [load]);

  // Đóng dropdown khi bấm ra ngoài / nhấn Escape.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const tgt = e.target as Node;
      if (accountRef.current && !accountRef.current.contains(tgt)) setAccountOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(tgt)) setMobileOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setAccountOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  async function logout() {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setAccountOpen(false);
    setMobileOpen(false);
    window.dispatchEvent(new Event(AUTH_EVENT));
    // Quay về trang chủ (không ở lại trang cá nhân/được bảo vệ sau khi đăng xuất).
    router.push('/');
    router.refresh();
  }

  const isLoggedIn = !!user && !user.isGuest;
  const closeAll = () => {
    setAccountOpen(false);
    setMobileOpen(false);
  };

  const brand = (
    <Link
      href="/"
      onClick={closeAll}
      className="mr-auto flex items-center gap-2 text-lg font-bold text-snake"
    >
      {settings?.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={settings.logoUrl} alt={title} className="h-7 w-auto object-contain" />
      ) : (
        <span>🐍</span>
      )}
      <span>{title}</span>
    </Link>
  );

  // --- Dropdown tài khoản (dùng chung desktop; mobile hiển thị phẳng trong panel) ---
  const accountMenuItems = (onNavigate: () => void) => (
    <>
      {ACCOUNT_LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          onClick={onNavigate}
          className="block rounded px-3 py-2 text-sm hover:bg-black/5 focus:bg-black/5 focus:outline-none"
        >
          {t(l.key)}
        </Link>
      ))}
      {user?.role === 'admin' && (
        // Trang admin nằm ngoài routing i18n → thẻ a thường. Backend vẫn kiểm tra quyền.
        <a
          href="/admin/"
          onClick={onNavigate}
          className="block rounded px-3 py-2 text-sm font-medium text-snake hover:bg-black/5"
        >
          {t('admin')}
        </a>
      )}
      <button
        onClick={logout}
        className="block w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none"
      >
        {t('logout')}
      </button>
    </>
  );

  return (
    <nav className="relative border-b border-black/10 px-4 py-3">
      <div className="flex items-center gap-x-4">
        {brand}

        {/* Desktop: links điều hướng */}
        <div className="hidden items-center gap-4 sm:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:underline">
              {t(l.key)}
            </Link>
          ))}
          {customPages.map((p) => (
            <NextLink key={p.slug} href={pageHref(p.slug)} className="hover:underline">
              {p.label}
            </NextLink>
          ))}
        </div>

        {/* Desktop: khu tài khoản */}
        <div className="hidden items-center gap-3 sm:flex">
          {loaded &&
            (isLoggedIn ? (
              <>
                <NotificationBell />
                <div className="relative" ref={accountRef}>
                  <button
                    onClick={() => setAccountOpen((o) => !o)}
                    aria-haspopup="menu"
                    aria-expanded={accountOpen}
                    className="flex items-center gap-1 rounded px-2 py-1 text-sm font-medium hover:bg-black/5"
                  >
                    {user!.nickname}
                    <span className={`text-xs transition-transform ${accountOpen ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>
                  {accountOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-black/10 bg-white py-1 shadow-lg"
                    >
                      {accountMenuItems(() => setAccountOpen(false))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="rounded bg-snake px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  {t('register')}
                </Link>
                <Link href="/login" className="text-sm hover:underline">
                  {t('login')}
                </Link>
              </>
            ))}
        </div>

        <div className="hidden sm:block">
          <LanguageSwitcher />
        </div>

        {/* Mobile: chuông (nếu đã đăng nhập) + nút menu */}
        <div className="ml-auto flex items-center gap-2 sm:hidden" ref={mobileRef}>
          {loaded && isLoggedIn && <NotificationBell />}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={t('menu')}
            aria-expanded={mobileOpen}
            className="rounded border border-black/15 px-2.5 py-1.5 text-lg leading-none hover:bg-black/5"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>

          {/* Panel mobile */}
          {mobileOpen && (
            <div className="absolute inset-x-0 top-full z-50 mt-0 border-b border-black/10 bg-white px-4 py-3 shadow-lg">
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={closeAll}
                    className="rounded px-3 py-2 text-sm hover:bg-black/5"
                  >
                    {t(l.key)}
                  </Link>
                ))}
                {customPages.map((p) => (
                  <NextLink
                    key={p.slug}
                    href={pageHref(p.slug)}
                    onClick={closeAll}
                    className="rounded px-3 py-2 text-sm hover:bg-black/5"
                  >
                    {p.label}
                  </NextLink>
                ))}

                <div className="my-1 h-px bg-black/10" />

                {loaded &&
                  (isLoggedIn ? (
                    <>
                      <span className="px-3 py-1 text-xs uppercase tracking-wide opacity-50">
                        {user!.nickname}
                      </span>
                      {accountMenuItems(closeAll)}
                    </>
                  ) : (
                    <>
                      <Link
                        href="/register"
                        onClick={closeAll}
                        className="rounded bg-snake px-3 py-2 text-center text-sm font-semibold text-white"
                      >
                        {t('register')}
                      </Link>
                      <Link
                        href="/login"
                        onClick={closeAll}
                        className="rounded px-3 py-2 text-sm hover:bg-black/5"
                      >
                        {t('login')}
                      </Link>
                    </>
                  ))}

                <div className="my-1 h-px bg-black/10" />
                <div className="px-3 py-1">
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
