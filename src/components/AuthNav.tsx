'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { apiFetch } from '@/lib/api';

interface Me {
  nickname: string;
  isGuest: boolean;
  role?: 'user' | 'admin';
}

// Sự kiện toàn cục để AuthNav cập nhật ngay sau khi login/logout (không cần F5).
export const AUTH_EVENT = 'gs:auth-changed';

export default function AuthNav() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [user, setUser] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);

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

  async function logout() {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.dispatchEvent(new Event(AUTH_EVENT));
    router.refresh();
  }

  if (!loaded) return <span className="w-16" />;

  if (user && !user.isGuest) {
    return (
      <span className="flex items-center gap-2 text-sm">
        {user.role === 'admin' && (
          // Trang admin nằm ngoài routing i18n → dùng thẻ a thường.
          <a href="/admin/" className="font-medium text-snake hover:underline">
            {t('admin')}
          </a>
        )}
        <Link href="/profile" className="font-medium hover:underline">
          {user.nickname}
        </Link>
        <button onClick={logout} className="opacity-70 hover:underline">
          {t('logout')}
        </button>
      </span>
    );
  }

  return (
    <Link href="/login" className="text-sm hover:underline">
      {t('login')}
    </Link>
  );
}
