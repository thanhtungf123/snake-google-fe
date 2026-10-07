'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface Me {
  nickname: string;
  role?: 'user' | 'admin';
}

const TABS = [
  { href: '/admin/', label: 'Tổng quan' },
  { href: '/admin/users/', label: 'Người dùng' },
  { href: '/admin/scores/', label: 'Điểm' },
  { href: '/admin/seasons/', label: 'Mùa giải' },
  { href: '/admin/content/', label: 'Nội dung' },
  { href: '/admin/pages/', label: 'Trang tùy chỉnh' },
  { href: '/admin/settings/', label: 'Cấu hình' },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<'loading' | 'forbidden' | 'ok'>('loading');

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then((r) => r.json())
      .then((d: { user: Me | null }) => {
        setState(d.user && d.user.role === 'admin' ? 'ok' : 'forbidden');
      })
      .catch(() => setState('forbidden'));
  }, []);

  if (state === 'loading') {
    return <div className="mx-auto max-w-5xl px-4 py-10 opacity-60">Đang tải…</div>;
  }

  if (state === 'forbidden') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold">Khu vực quản trị</h1>
        <p className="opacity-80">Bạn không có quyền truy cập trang này.</p>
        <a href="/" className="mt-4 inline-block text-snake underline">
          ← Về trang chủ
        </a>
      </div>
    );
  }

  // Bỏ prefix locale (vd /vi) nếu có để so khớp tab.
  const normalized = pathname.replace(/^\/(en|vi)(?=\/|$)/, '') || '/';
  const current = normalized.endsWith('/') ? normalized : normalized + '/';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Quản trị</h1>
      <nav className="mb-6 flex flex-wrap gap-2 border-b border-black/10 pb-3">
        {TABS.map((tItem) => {
          const active =
            tItem.href === '/admin/' ? current === '/admin/' : current.startsWith(tItem.href);
          return (
            <a
              key={tItem.href}
              href={tItem.href}
              className={`rounded px-3 py-1.5 text-sm ${
                active ? 'bg-snake text-white' : 'bg-black/5 hover:bg-black/10'
              }`}
            >
              {tItem.label}
            </a>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
