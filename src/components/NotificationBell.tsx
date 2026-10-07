'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { apiFetch } from '@/lib/api';
import { NOTIF_EVENT } from '@/lib/notifications';
import { renderNotif, type NotifLike } from '@/lib/notifRender';
import { AUTH_EVENT } from './AuthNav';

const POLL_MS = 60_000;

interface Notif extends NotifLike {
  id: string;
  read: boolean;
  createdAt: string | null;
}

const TYPE_ICON: Record<Notif['type'], string> = {
  achievement: '🏆',
  challenge: '🎯',
  reward: '🎁',
  system: '🔔',
};

// Chuông thông báo trên nav: badge chưa đọc + popup dropdown danh sách gần đây.
export default function NotificationBell() {
  const t = useTranslations();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const refreshCount = useCallback(() => {
    apiFetch('/api/notifications/unread-count')
      .then(async (r) => (r.ok ? (await r.json()).count : 0))
      .then((c) => setCount(typeof c === 'number' ? c : 0))
      .catch(() => setCount(0));
  }, []);

  const loadList = useCallback(() => {
    setLoading(true);
    apiFetch('/api/notifications?limit=8')
      .then((r) => (r.ok ? r.json() : { rows: [] }))
      .then((d) => setRows(d.rows ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, POLL_MS);
    window.addEventListener(NOTIF_EVENT, refreshCount);
    window.addEventListener(AUTH_EVENT, refreshCount);
    return () => {
      clearInterval(id);
      window.removeEventListener(NOTIF_EVENT, refreshCount);
      window.removeEventListener(AUTH_EVENT, refreshCount);
    };
  }, [refreshCount]);

  // Đóng popup khi bấm ra ngoài.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  }

  async function markRead(id: string) {
    setRows((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setCount((c) => Math.max(0, c - 1));
    await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
  }

  async function markAll() {
    setRows((prev) => prev.map((n) => ({ ...n, read: true })));
    setCount(0);
    await apiFetch('/api/notifications/read-all', { method: 'POST' });
  }

  return (
    <div ref={boxRef} className="relative inline-flex items-center">
      <button
        onClick={toggle}
        className="relative inline-flex items-center"
        aria-label={t('Inbox.title')}
        title={t('Inbox.title')}
      >
        <span className="text-lg leading-none">🔔</span>
        {count > 0 && (
          <span className="absolute -right-2 -top-2 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[0.65rem] font-bold leading-4 text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-black/10 px-3 py-2">
            <span className="font-semibold">{t('Inbox.title')}</span>
            {rows.some((n) => !n.read) && (
              <button onClick={markAll} className="text-xs text-snake hover:underline">
                {t('Inbox.markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-3 py-6 text-center text-sm opacity-60">…</p>
            ) : rows.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm opacity-60">{t('Inbox.empty')}</p>
            ) : (
              <ul className="divide-y divide-black/5">
                {rows.map((n) => {
                  const { title, body } = renderNotif(t, n);
                  return (
                    <li
                      key={n.id}
                      onClick={() => !n.read && markRead(n.id)}
                      className={`flex cursor-pointer gap-2 px-3 py-2 hover:bg-black/5 ${
                        n.read ? '' : 'bg-snake/5'
                      }`}
                    >
                      <span className="text-base leading-none">{TYPE_ICON[n.type]}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{title}</p>
                        {body && <p className="truncate text-xs opacity-70">{body}</p>}
                      </div>
                      {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-snake" />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Link
            href="/inbox"
            onClick={() => setOpen(false)}
            className="block border-t border-black/10 px-3 py-2 text-center text-sm text-snake hover:bg-black/5"
          >
            {t('Inbox.viewAll')}
          </Link>
        </div>
      )}
    </div>
  );
}
