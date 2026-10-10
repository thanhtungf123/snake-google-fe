'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TOAST_EVENT, TOAST_KEY } from '@/lib/pendingScore';

// Popup nhỏ góc màn hình báo "Đã lưu điểm {score} thành công!" sau khi khách đăng nhập/đăng ký.
// Kích hoạt khi có key gs:scoreSavedToast trong localStorage (lúc mount hoặc qua sự kiện).
export default function ScoreSavedToast() {
  const t = useTranslations('PostGame');
  const [toast, setToast] = useState<{ score: number; status: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    let payload: { score: number; status: string } | null = null;
    try {
      const raw = localStorage.getItem(TOAST_KEY);
      if (raw) {
        payload = JSON.parse(raw);
        localStorage.removeItem(TOAST_KEY);
      }
    } catch {
      /* ignore */
    }
    if (!payload || typeof payload.score !== 'number') return;
    setToast(payload);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 6000);
  }, []);

  useEffect(() => {
    show();
    window.addEventListener(TOAST_EVENT, show);
    return () => {
      window.removeEventListener(TOAST_EVENT, show);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [show]);

  if (!toast) return null;

  const verifying = toast.status === 'flagged';

  return (
    <div className="fixed bottom-4 left-1/2 z-[80] w-[min(92vw,24rem)] -translate-x-1/2">
      <div className="flex items-start gap-3 rounded-lg border border-green-600/20 bg-white px-4 py-3 shadow-lg">
        <span className="text-xl leading-none">{verifying ? '⏳' : '✅'}</span>
        <div className="flex-1 text-sm">
          <p className="font-semibold text-green-700">{t('savedToast', { score: toast.score })}</p>
          {verifying && <p className="mt-0.5 text-xs opacity-70">{t('verifying')}</p>}
        </div>
        <button
          onClick={() => setToast(null)}
          aria-label={t('close')}
          className="rounded px-1 text-sm opacity-50 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
