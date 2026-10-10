'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

interface Saved {
  status: 'valid' | 'flagged' | 'rejected';
  score: number;
  isGuest: boolean;
  isNewBest: boolean;
  personalBest: number;
}

// Khung hiện ngay dưới game sau khi kết thúc ván: mời khách đăng ký lưu điểm,
// hoặc hiện kỷ lục cho người đã đăng nhập. Dữ liệu đến từ ScoreBridge (postMessage).
export default function PostGamePanel() {
  const t = useTranslations('PostGame');
  const [data, setData] = useState<Saved | null>(null);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      // Chỉ nhận message từ chính origin của site (iframe game cùng origin).
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: string; payload?: Partial<Saved> };
      if (!d || typeof d !== 'object') return;
      if (d.type === 'gs:game-started') {
        setData(null);
        return;
      }
      if (d.type === 'gs:score-saved' && d.payload) {
        const p = d.payload;
        setData({
          status: (p.status as Saved['status']) ?? 'valid',
          score: p.score ?? 0,
          isGuest: !!p.isGuest,
          isNewBest: !!p.isNewBest,
          personalBest: p.personalBest ?? 0,
        });
      }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  if (!data) return null;

  const replay = () => {
    window.dispatchEvent(new Event('gs:replay'));
    setData(null);
  };

  const scored = data.score > 0;
  const primaryBtn = 'rounded bg-snake px-4 py-2 text-sm font-semibold text-white hover:opacity-90';
  const ghostBtn = 'rounded border border-black/15 px-4 py-2 text-sm hover:bg-black/5';

  return (
    <div className="mx-auto mt-4 max-w-3xl rounded-lg border border-black/10 bg-black/[0.02] p-4 text-center">
      <p className="text-lg font-semibold">
        {scored ? t('youScored', { score: data.score }) : t('youScoredZero')}
      </p>

      {data.status === 'flagged' && (
        <p className="mt-1 text-sm text-amber-600">{t('verifying')}</p>
      )}
      {data.status === 'rejected' && (
        <p className="mt-1 text-sm text-red-600">{t('notCounted')}</p>
      )}

      {data.isGuest ? (
        <>
          {scored && <p className="mt-1 text-sm opacity-80">{t('guestInvite')}</p>}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {scored && (
              <Link href="/register" className={primaryBtn}>
                {t('registerSave')}
              </Link>
            )}
            {scored && (
              <Link href="/login" className={ghostBtn}>
                {t('login')}
              </Link>
            )}
            <button onClick={replay} className={ghostBtn}>
              {t('playAgain')}
            </button>
          </div>
        </>
      ) : (
        <>
          {data.isNewBest ? (
            <p className="mt-1 text-sm font-semibold text-snake">{t('newRecord')}</p>
          ) : (
            data.status === 'valid' && (
              <p className="mt-1 text-sm opacity-70">{t('yourBest', { best: data.personalBest })}</p>
            )
          )}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Link href="/leaderboard" className={primaryBtn}>
              {t('viewLeaderboard')}
            </Link>
            <button onClick={replay} className={ghostBtn}>
              {t('playAgain')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
