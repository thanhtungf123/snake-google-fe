'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { apiFetch } from '@/lib/api';
import { NOTIF_EVENT } from '@/lib/notifications';

interface Notif {
  id: string;
  type: 'achievement' | 'challenge' | 'reward' | 'system';
  messageKey: string | null;
  data: Record<string, unknown> | null;
  title: string | null;
  body: string | null;
  read: boolean;
  createdAt: string | null;
}

const TYPE_ICON: Record<Notif['type'], string> = {
  achievement: '🏆',
  challenge: '🎯',
  reward: '🎁',
  system: '🔔',
};

const PAGE = 20;

export default function InboxClient() {
  const t = useTranslations();
  const [rows, setRows] = useState<Notif[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<'loading' | 'unauth' | 'ready'>('loading');

  const load = useCallback((skip: number) => {
    apiFetch(`/api/notifications?skip=${skip}&limit=${PAGE}`)
      .then(async (r) => {
        if (r.status === 401) {
          setState('unauth');
          return;
        }
        const d = await r.json();
        setRows((prev) => (skip === 0 ? d.rows : [...prev, ...d.rows]));
        setTotal(d.total);
        setState('ready');
      })
      .catch(() => setState('unauth'));
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  async function markRead(id: string) {
    setRows((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
    window.dispatchEvent(new Event(NOTIF_EVENT));
  }

  async function markAll() {
    setRows((prev) => prev.map((n) => ({ ...n, read: true })));
    await apiFetch('/api/notifications/read-all', { method: 'POST' });
    window.dispatchEvent(new Event(NOTIF_EVENT));
  }

  // Dựng văn bản thông báo: ưu tiên title/body ghi đè; nếu không thì render theo i18n.
  function render(n: Notif): { title: string; body: string } {
    if (n.title || n.body) return { title: n.title ?? '', body: n.body ?? '' };
    // Chỉ giữ tham số kiểu nguyên thuỷ để hợp với i18n (TranslationValues).
    const data: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(n.data ?? {})) {
      if (typeof v === 'string' || typeof v === 'number') data[k] = v;
    }
    const code = typeof data.code === 'string' ? data.code : null;
    // Chèn tên/mô tả thành tích hoặc thử thách (namespace riêng) vào tham số.
    if (code && n.type === 'achievement') {
      if (t.has(`Achievements.defs.${code}.name`)) data.name = t(`Achievements.defs.${code}.name`);
      if (t.has(`Achievements.defs.${code}.desc`)) data.desc = t(`Achievements.defs.${code}.desc`);
    }
    if (code && n.type === 'challenge') {
      if (t.has(`Challenges.defs.${code}.name`)) data.name = t(`Challenges.defs.${code}.name`, data);
    }
    const key = n.messageKey;
    const titleKey = key ? `Inbox.messages.${key}` : null;
    const bodyKey = key ? `Inbox.messages.${key}Body` : null;
    const title = titleKey && t.has(titleKey) ? t(titleKey, data) : (key ?? '');
    const body = bodyKey && t.has(bodyKey) ? t(bodyKey, data) : '';
    return { title, body };
  }

  if (state === 'loading') return <p className="opacity-60">…</p>;

  if (state === 'unauth') {
    return (
      <div className="space-y-3">
        <p className="opacity-80">{t('Inbox.loginRequired')}</p>
        <Link href="/login" className="inline-block rounded bg-snake px-4 py-2 font-semibold text-white">
          {t('Inbox.goLogin')}
        </Link>
      </div>
    );
  }

  if (rows.length === 0) {
    return <p className="opacity-70">{t('Inbox.empty')}</p>;
  }

  const hasUnread = rows.some((n) => !n.read);

  return (
    <div className="space-y-4">
      {hasUnread && (
        <div className="flex justify-end">
          <button onClick={markAll} className="text-sm text-snake hover:underline">
            {t('Inbox.markAllRead')}
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {rows.map((n) => {
          const { title, body } = render(n);
          return (
            <li
              key={n.id}
              className={`flex gap-3 rounded-lg border p-3 ${
                n.read ? 'border-black/10 bg-transparent' : 'border-snake/40 bg-snake/5'
              }`}
            >
              <span className="text-xl leading-none">{TYPE_ICON[n.type]}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <p className="flex-1 font-medium">{title}</p>
                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="shrink-0 text-xs text-snake hover:underline"
                    >
                      {t('Inbox.markRead')}
                    </button>
                  )}
                </div>
                {body && <p className="mt-0.5 text-sm opacity-80">{body}</p>}
                {n.createdAt && (
                  <p className="mt-1 text-xs opacity-50">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {rows.length < total && (
        <div className="flex justify-center">
          <button
            onClick={() => load(rows.length)}
            className="rounded border border-black/15 px-4 py-2 text-sm hover:bg-black/5"
          >
            {t('Inbox.loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}
