'use client';

import { useEffect, useState, type ReactNode, type ComponentType, type SVGProps } from 'react';
import Link, { useLinkStatus } from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import PageLoader from '@/components/ui/PageLoader';
import Spinner from '@/components/ui/Spinner';
import {
  IconDashboard,
  IconUsers,
  IconTrophy,
  IconCalendar,
  IconGift,
  IconFile,
  IconGamepad,
  IconSettings,
  IconSun,
  IconMoon,
  IconMenu,
  IconClose,
  IconChevronLeft,
  IconExternal,
  IconLogout,
} from './ui/icons';

interface Me {
  nickname: string;
  role?: 'user' | 'admin';
}

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const TABS: { href: string; label: string; icon: IconType }[] = [
  { href: '/admin/', label: 'Tổng quan', icon: IconDashboard },
  { href: '/admin/users/', label: 'Người dùng', icon: IconUsers },
  { href: '/admin/scores/', label: 'Điểm', icon: IconTrophy },
  { href: '/admin/seasons/', label: 'Mùa giải', icon: IconCalendar },
  { href: '/admin/rewards/', label: 'Nhận thưởng', icon: IconGift },
  { href: '/admin/pages/', label: 'Trang', icon: IconFile },
  { href: '/admin/games/', label: 'Game', icon: IconGamepad },
  { href: '/admin/settings/', label: 'Cấu hình', icon: IconSettings },
];

type Theme = 'light' | 'dark';

// Nội dung một mục sidebar. Dùng useLinkStatus (phải nằm TRONG <Link>) để biết
// khi nào đang điều hướng tới mục này → sáng ngay + hiện spinner, cho cảm giác
// bấm là có phản hồi tức thì (không chờ route load xong mới đổi highlight).
function NavRow({
  icon: Icon,
  label,
  active,
  mini,
}: {
  icon: IconType;
  label: string;
  active: boolean;
  mini: boolean;
}) {
  const { pending } = useLinkStatus();
  const on = active || pending;
  return (
    <span
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        mini ? 'justify-center' : ''
      } ${
        on
          ? 'bg-[var(--ad-sidebar-active)] text-white'
          : 'text-[var(--ad-sidebar-text)] hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!mini && <span className="truncate">{label}</span>}
      {pending && <Spinner className={`h-4 w-4 ${mini ? 'absolute right-1 top-1' : 'ml-auto'}`} />}
    </span>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'forbidden' | 'ok'>('loading');
  const [me, setMe] = useState<Me | null>(null);
  const [theme, setTheme] = useState<Theme>('light');
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then((r) => r.json())
      .then((d: { user: Me | null }) => {
        setMe(d.user);
        setState(d.user && d.user.role === 'admin' ? 'ok' : 'forbidden');
      })
      .catch(() => setState('forbidden'));
  }, []);

  // Khôi phục lựa chọn theme + thu gọn từ localStorage.
  useEffect(() => {
    try {
      const t = localStorage.getItem('admin-theme');
      if (t === 'dark' || t === 'light') setTheme(t);
      setCollapsed(localStorage.getItem('admin-collapsed') === '1');
    } catch {
      /* bỏ qua */
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('admin-theme', next);
      } catch {
        /* bỏ qua */
      }
      return next;
    });
  };

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('admin-collapsed', next ? '1' : '0');
      } catch {
        /* bỏ qua */
      }
      return next;
    });
  };

  async function logout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* bỏ qua */
    }
    router.push('/');
    router.refresh();
  }

  if (state === 'loading') {
    // Overlay phủ toàn màn hình ngay từ đầu để không lộ header/menu của site công khai.
    return (
      <div
        className="admin-root fixed inset-0 z-40 grid place-items-center"
        data-admin-theme={theme}
      >
        <PageLoader minHeight="min-h-[40vh]" />
      </div>
    );
  }

  if (state === 'forbidden') {
    return (
      <div
        className="admin-root fixed inset-0 z-40 grid place-items-center p-6 text-center"
        data-admin-theme={theme}
      >
        <div>
          <h1 className="mb-2 text-2xl font-bold">Khu vực quản trị</h1>
          <p className="text-[var(--ad-muted)]">Bạn không có quyền truy cập trang này.</p>
          <a href="/" className="mt-4 inline-block text-[var(--ad-accent)] underline">
            ← Về trang chủ
          </a>
        </div>
      </div>
    );
  }

  // Bỏ prefix locale (vd /vi) nếu có để so khớp tab.
  const normalized = pathname.replace(/^\/(en|vi)(?=\/|$)/, '') || '/';
  const current = normalized.endsWith('/') ? normalized : normalized + '/';
  // Giữ nguyên tiền tố locale khi điều hướng (VI nằm dưới /vi, EN không prefix).
  const localePrefix = pathname.startsWith('/vi') ? '/vi' : '';
  const activeTab =
    TABS.find((t) => (t.href === '/admin/' ? current === '/admin/' : current.startsWith(t.href))) ??
    TABS[0];

  const navLinks = (mini: boolean, onNavigate?: () => void) =>
    TABS.map((t) => {
      const active =
        t.href === '/admin/' ? current === '/admin/' : current.startsWith(t.href);
      const Icon = t.icon;
      return (
        <Link
          key={t.href}
          href={`${localePrefix}${t.href}`}
          prefetch
          onClick={onNavigate}
          title={mini ? t.label : undefined}
          className="block rounded-lg"
        >
          <NavRow icon={Icon} label={t.label} active={active} mini={mini} />
        </Link>
      );
    });

  const brandEl = (mini: boolean) => (
    <div className="flex items-center gap-2 px-1">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--ad-sidebar-active)] text-sm font-black text-white">
        GS
      </div>
      {!mini && (
        <div className="leading-tight">
          <div className="text-sm font-bold text-white">Google Snake</div>
          <div className="text-[11px] text-[var(--ad-sidebar-muted)]">Bảng điều khiển</div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="admin-root fixed inset-0 z-40 flex text-[var(--ad-text)]"
      data-admin-theme={theme}
    >
      {/* Sidebar desktop */}
      <aside
        className={`hidden shrink-0 flex-col bg-[var(--ad-sidebar)] p-3 transition-[width] duration-200 lg:flex ${
          collapsed ? 'w-[76px]' : 'w-60'
        }`}
      >
        <div className="mb-4 flex h-10 items-center justify-between">
          {brandEl(collapsed)}
        </div>
        <nav className="admin-scroll flex-1 space-y-1 overflow-y-auto">{navLinks(collapsed)}</nav>
        <button
          onClick={toggleCollapsed}
          className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--ad-sidebar-muted)] transition-colors hover:bg-white/5 hover:text-white"
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          <IconChevronLeft className={`h-5 w-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && <span>Thu gọn</span>}
        </button>
      </aside>

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-[var(--ad-sidebar)] p-3">
            <div className="mb-4 flex h-10 items-center justify-between">
              {brandEl(false)}
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1.5 text-[var(--ad-sidebar-muted)] hover:bg-white/5 hover:text-white"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            <nav className="admin-scroll flex-1 space-y-1 overflow-y-auto">
              {navLinks(false, () => setDrawerOpen(false))}
            </nav>
          </aside>
        </div>
      )}

      {/* Cột nội dung */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--ad-border)] bg-[var(--ad-surface)] px-3 sm:px-5">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 hover:bg-[var(--ad-hover)] lg:hidden"
            aria-label="Mở menu"
          >
            <IconMenu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-[var(--ad-muted)]">
              <span>Quản trị</span>
              <span>/</span>
              <span className="truncate font-medium text-[var(--ad-text)]">{activeTab.label}</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-[var(--ad-muted)] transition-colors hover:bg-[var(--ad-hover)] hover:text-[var(--ad-text)]"
              title={theme === 'dark' ? 'Chuyển sáng' : 'Chuyển tối'}
              aria-label="Đổi giao diện sáng/tối"
            >
              {theme === 'dark' ? <IconSun className="h-5 w-5" /> : <IconMoon className="h-5 w-5" />}
            </button>
            <a
              href="/"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[var(--ad-muted)] transition-colors hover:bg-[var(--ad-hover)] hover:text-[var(--ad-text)] sm:inline-flex"
              title="Mở trang chủ"
            >
              <IconExternal className="h-4 w-4" />
              <span>Xem web</span>
            </a>
            <div className="mx-1 hidden h-6 w-px bg-[var(--ad-border)] sm:block" />
            <div className="hidden items-center gap-2 sm:flex">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--ad-accent-weak)] text-xs font-bold text-[var(--ad-accent)]">
                {(me?.nickname ?? 'A').slice(0, 2).toUpperCase()}
              </div>
              <div className="leading-tight">
                <div className="max-w-[120px] truncate text-sm font-medium">{me?.nickname}</div>
                <div className="text-[11px] text-[var(--ad-muted)]">Quản trị viên</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-[var(--ad-muted)] transition-colors hover:bg-[var(--ad-danger-weak)] hover:text-[var(--ad-danger)]"
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <IconLogout className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Nội dung chính (cuộn riêng) */}
        <main className="admin-scroll flex-1 overflow-y-auto p-4 sm:p-6">
          <div key={current} className="animate-fade-in mx-auto max-w-7xl">
            <h1 className="mb-5 text-xl font-bold sm:text-2xl">{activeTab.label}</h1>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
