'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { writePending } from '@/lib/pendingScore';

interface Saved {
  status: 'valid' | 'flagged' | 'rejected';
  score: number;
  isGuest: boolean;
  isNewBest: boolean;
  personalBest: number;
  // true = vừa game-over, đang chờ server xác nhận lưu điểm (hiện popup trước cho nhanh).
  pending: boolean;
}

// Popup (modal) hiện giữa màn hình sau khi kết thúc ván:
//  - Khách có điểm: mời đăng nhập/đăng ký để lưu điểm (lưu tạm điểm để báo "đã lưu" sau khi auth).
//  - Người đã đăng nhập: báo đã lưu điểm + kỷ lục.
// Dữ liệu đến từ ScoreBridge trong iframe game (postMessage).
export default function PostGamePanel() {
  const t = useTranslations('PostGame');
  const [data, setData] = useState<Saved | null>(null);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: string; payload?: Partial<Saved> };
      if (!d || typeof d !== 'object') return;
      if (d.type === 'gs:game-started') {
        setData(null);
        return;
      }
      // Game vừa kết thúc: hiện popup NGAY ở trạng thái "đang lưu" (không chờ mạng).
      if (d.type === 'gs:game-over') {
        const score = d.payload?.score ?? 0;
        setData({
          status: 'valid',
          score,
          isGuest: false,
          isNewBest: false,
          personalBest: 0,
          pending: true,
        });
        return;
      }
      if (d.type === 'gs:score-saved' && d.payload) {
        const p = d.payload;
        const saved: Saved = {
          status: (p.status as Saved['status']) ?? 'valid',
          score: p.score ?? 0,
          isGuest: !!p.isGuest,
          isNewBest: !!p.isNewBest,
          personalBest: p.personalBest ?? 0,
          pending: false,
        };
        // Giữ popup nếu đang mở (từ gs:game-over), chỉ cập nhật nội dung thật.
        setData(saved);
        // Khách có điểm > 0: nhớ điểm để sau khi đăng nhập/đăng ký hiện popup "đã lưu".
        if (saved.isGuest && saved.score > 0 && saved.status !== 'rejected') {
          writePending(saved.score, saved.status);
        }
      }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Khoá cuộn nền khi popup mở.
  useEffect(() => {
    if (!data) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [data]);

  if (!data) return null;

  const close = () => setData(null);
  const replay = () => {
    window.dispatchEvent(new Event('gs:replay'));
    setData(null);
  };

  const scored = data.score > 0;
  const primaryBtn =
    'rounded bg-snake px-4 py-2 text-sm font-semibold text-white hover:opacity-90';
  const ghostBtn = 'rounded border border-black/15 px-4 py-2 text-sm hover:bg-black/5';

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={close}
    >
      <div
        className="relative w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label={t('close')}
          className="absolute right-3 top-3 rounded px-2 py-1 text-lg leading-none opacity-50 hover:bg-black/5 hover:opacity-100"
        >
          ✕
        </button>

        <p className="text-xl font-bold">
          {scored ? t('youScored', { score: data.score }) : t('youScoredZero')}
        </p>

        {data.status === 'flagged' && (
          <p className="mt-1 text-sm text-amber-600">{t('verifying')}</p>
        )}
        {data.status === 'rejected' && (
          <p className="mt-1 text-sm text-red-600">{t('notCounted')}</p>
        )}

        {data.pending ? (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-sm opacity-70">{t('saving')}</p>
            <button onClick={replay} className={ghostBtn}>
              {t('playAgain')}
            </button>
          </div>
        ) : data.isGuest ? (
          <>
            {scored && <p className="mt-2 text-sm opacity-80">{t('guestInvite')}</p>}
            <div className="mt-4 flex flex-col gap-2">
              {scored && (
                <Link href="/register" className={primaryBtn} onClick={close}>
                  {t('registerSave')}
                </Link>
              )}
              {scored && (
                <Link href="/login" className={ghostBtn} onClick={close}>
                  {t('login')}
                </Link>
              )}
              <button onClick={replay} className={scored ? ghostBtn : primaryBtn}>
                {t('playAgain')}
              </button>
              {scored && (
                <button onClick={close} className="mt-1 text-sm opacity-60 hover:opacity-100">
                  {t('later')}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {data.status === 'valid' && (
              <p className="mt-2 text-sm font-medium text-green-700">
                {scored ? t('savedBody', { score: data.score }) : t('savedTitle')}
              </p>
            )}
            {data.isNewBest ? (
              <p className="mt-1 text-sm font-semibold text-snake">{t('newRecord')}</p>
            ) : (
              data.status === 'valid' &&
              scored && (
                <p className="mt-1 text-sm opacity-70">{t('yourBest', { best: data.personalBest })}</p>
              )
            )}
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/leaderboard" className={primaryBtn} onClick={close}>
                {t('viewLeaderboard')}
              </Link>
              <button onClick={replay} className={ghostBtn}>
                {t('playAgain')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
