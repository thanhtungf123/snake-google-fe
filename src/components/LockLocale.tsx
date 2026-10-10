'use client';

import { useEffect } from 'react';

// Báo cho <LanguageSwitcher> biết trang hiện tại chỉ có 1 ngôn ngữ → ẩn nút chuyển EN/VI.
// Dùng biến global + event vì LanguageSwitcher nằm ở Nav (khác nhánh cây với trang nội dung).
export const LOCALE_LOCK_EVENT = 'localelock';

declare global {
  interface Window {
    __localeLock?: string | null;
  }
}

export default function LockLocale({ locale }: { locale: string }) {
  useEffect(() => {
    window.__localeLock = locale;
    window.dispatchEvent(new Event(LOCALE_LOCK_EVENT));
    return () => {
      window.__localeLock = null;
      window.dispatchEvent(new Event(LOCALE_LOCK_EVENT));
    };
  }, [locale]);

  return null;
}
