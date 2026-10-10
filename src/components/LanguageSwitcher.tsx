'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { LOCALE_LOCK_EVENT } from './LockLocale';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();

  // Trang 1 ngôn ngữ (custom page chỉ có EN hoặc chỉ có VI) sẽ khoá ngôn ngữ → ẩn nút chuyển.
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const sync = () => setLocked(!!window.__localeLock);
    sync();
    window.addEventListener(LOCALE_LOCK_EVENT, sync);
    return () => window.removeEventListener(LOCALE_LOCK_EVENT, sync);
  }, [pathname]);

  if (locked) return null;

  const switchTo = (next: 'en' | 'vi') => {
    if (next === locale) return;

    // Nếu trang hiện tại có thẻ alternate link (ví dụ custom page /p/[slug] có slug khác nhau giữa EN và VI)
    if (typeof document !== 'undefined') {
      const alt = document.querySelector<HTMLLinkElement>(
        `link[rel="alternate"][hreflang="${next}"]`
      );
      if (alt?.href) {
        try {
          const u = new URL(alt.href);
          window.location.href = u.pathname + u.search + u.hash;
          return;
        } catch {
          // fallback bên dưới
        }
      }
    }

    // Giữ nguyên trang hiện tại, chỉ đổi ngôn ngữ (dẫn sang URL tương đương theo pathnames).
    router.replace(
      // @ts-expect-error pathname động
      { pathname, params },
      { locale: next }
    );
  };

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => switchTo('en')}
        className={locale === 'en' ? 'font-bold underline' : 'opacity-70'}
      >
        EN
      </button>
      <span className="opacity-40">|</span>
      <button
        onClick={() => switchTo('vi')}
        className={locale === 'vi' ? 'font-bold underline' : 'opacity-70'}
      >
        VI
      </button>
    </div>
  );
}
