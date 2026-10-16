'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

// Wrapper dùng chung cho MỌI khung game (iframe GamePix ở /games/[slug] và game chính ở trang chủ).
// - Nút Fullscreen (toàn màn hình) — chạy trên Android & desktop; iOS Safari không hỗ trợ fullscreen
//   cho <div>/<iframe> nên nút tự ẩn khi trình duyệt không cho (document.fullscreenEnabled = false).
// - Overlay "xoay ngang điện thoại" khi game yêu cầu landscape mà máy đang dọc (chỉ trên thiết bị cảm ứng).
//   Không tự xoay được trên iOS (Apple chặn screen.orientation.lock) nên chỉ NHẮC user tự xoay.
export interface GameFrameLabels {
  fullscreen: string;
  exitFullscreen: string;
  rotateTitle: string;
  rotateHint: string;
}

// Kiểu fullscreen cũ của WebKit (Safari) — không có trong lib dom chuẩn.
interface FsElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}
interface FsDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
}
interface OrientationLock extends ScreenOrientation {
  lock?: (orientation: 'landscape' | 'portrait' | string) => Promise<void>;
}

export default function GameFrame({
  children,
  labels,
  requireLandscape = false,
  className = '',
  style,
}: {
  children: ReactNode;
  labels: GameFrameLabels;
  requireLandscape?: boolean;
  className?: string; // style khung khi KHÔNG fullscreen (viền, bo góc, tỉ lệ…)
  style?: CSSProperties; // vd aspectRatio
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);
  const [fsAllowed, setFsAllowed] = useState(false);
  const [showRotate, setShowRotate] = useState(false);

  // Trình duyệt có cho fullscreen không? (iOS Safari: false → ẩn nút)
  useEffect(() => {
    const d = document as FsDocument;
    setFsAllowed(Boolean(d.fullscreenEnabled || d.webkitFullscreenEnabled));
  }, []);

  // Theo dõi trạng thái fullscreen (hỗ trợ cả webkit).
  useEffect(() => {
    const d = document as FsDocument;
    const onChange = () => setIsFs(Boolean(d.fullscreenElement || d.webkitFullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  // Hiện overlay nhắc xoay: game yêu cầu landscape + thiết bị cảm ứng + đang để dọc.
  useEffect(() => {
    if (!requireLandscape || typeof window === 'undefined' || !window.matchMedia) return;
    const portrait = window.matchMedia('(orientation: portrait)');
    const coarse = window.matchMedia('(pointer: coarse)');
    const update = () => setShowRotate(portrait.matches && coarse.matches);
    update();
    portrait.addEventListener('change', update);
    coarse.addEventListener('change', update);
    return () => {
      portrait.removeEventListener('change', update);
      coarse.removeEventListener('change', update);
    };
  }, [requireLandscape]);

  const enterFullscreen = useCallback(async () => {
    const el = wrapRef.current as FsElement | null;
    if (!el) return;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch {
      return;
    }
    // Android: cố khoá ngang khi game yêu cầu landscape (iOS sẽ bỏ qua — không sao).
    if (requireLandscape) {
      const o = (screen.orientation ?? undefined) as OrientationLock | undefined;
      try {
        await o?.lock?.('landscape');
      } catch {
        /* iOS/desktop không hỗ trợ — bỏ qua */
      }
    }
  }, [requireLandscape]);

  const exitFullscreen = useCallback(async () => {
    const d = document as FsDocument;
    try {
      if (d.exitFullscreen) await d.exitFullscreen();
      else if (d.webkitExitFullscreen) await d.webkitExitFullscreen();
    } catch {
      /* bỏ qua */
    }
  }, []);

  const toggleFullscreen = isFs ? exitFullscreen : enterFullscreen;

  return (
    <div
      ref={wrapRef}
      className={isFs ? 'relative flex h-full w-full items-center justify-center bg-black' : `relative ${className}`}
      style={isFs ? undefined : style}
    >
      {children}

      {fsAllowed && (
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFs ? labels.exitFullscreen : labels.fullscreen}
          title={isFs ? labels.exitFullscreen : labels.fullscreen}
          className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-md bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {isFs ? <ExitIcon /> : <EnterIcon />}
        </button>
      )}

      {showRotate && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/90 px-6 text-center text-white">
          <RotateIcon />
          <p className="text-lg font-semibold">{labels.rotateTitle}</p>
          <p className="max-w-xs text-sm opacity-80">{labels.rotateHint}</p>
        </div>
      )}
    </div>
  );
}

function EnterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function ExitIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="animate-pulse">
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <path d="M12 3v2M12 19v2" />
      <path d="M7 10l-2 2 2 2M17 10l2 2-2 2" />
    </svg>
  );
}
