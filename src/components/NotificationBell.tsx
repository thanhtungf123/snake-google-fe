'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { apiFetch } from '@/lib/api';
import { NOTIF_EVENT } from '@/lib/notifications';
import { AUTH_EVENT } from './AuthNav';

const POLL_MS = 60_000;

// Chuông thông báo trên nav (chỉ hiện cho người đã đăng nhập).
// Poll số chưa đọc mỗi 60s; cũng cập nhật khi có sự kiện auth/notif.
export default function NotificationBell() {
  const t = useTranslations('Inbox');
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    apiFetch('/api/notifications/unread-count')
      .then(async (r) => {
        if (!r.ok) {
          setCount(0);
          return;
        }
        const d = await r.json();
        setCount(typeof d.count === 'number' ? d.count : 0);
      })
      .catch(() => setCount(0));
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    window.addEventListener(NOTIF_EVENT, refresh);
    window.addEventListener(AUTH_EVENT, refresh);
    return () => {
      clearInterval(id);
      window.removeEventListener(NOTIF_EVENT, refresh);
      window.removeEventListener(AUTH_EVENT, refresh);
    };
  }, [refresh]);

  return (
    <Link
      href="/inbox"
      className="relative inline-flex items-center"
      aria-label={t('title')}
      title={t('title')}
    >
      <span className="text-lg leading-none">🔔</span>
      {count > 0 && (
        <span className="absolute -right-2 -top-2 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[0.65rem] font-bold leading-4 text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
