'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';

// Nhúng game Google (bản vanilla) cho chế độ ranked.
// Vì iframe cùng origin với trang cha, ta ép snakeChosenMod='none' trước khi game tải
// để trang chủ luôn là bản không mod (khu /mods mới cho chọn mod).
export default function RankedGameEmbed() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('snakeChosenMod', 'none');
    } catch {}
    setReady(true);
  }, []);

  // Ẩn nút/indicator mod bên trong game (cùng origin nên chèn CSS được).
  // CSS áp cho cả phần tử tạo sau, nên không lo thứ tự tải.
  const onIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    try {
      const doc = e.currentTarget.contentDocument;
      if (!doc) return;
      // Ẩn UI mod
      const style = doc.createElement('style');
      style.textContent =
        '#mod-indicator,#mod-selector-dialogue-container{display:none !important}';
      doc.head.appendChild(style);
      // Truyền URL API cho bridge (backend tách riêng).
      const cfg = doc.createElement('script');
      cfg.textContent = `window.__GS_API__=${JSON.stringify(API_URL)};`;
      doc.head.appendChild(cfg);
      // Nhúng ScoreBridge (start/submit điểm + chẩn đoán)
      const s = doc.createElement('script');
      s.src = '/legacy-mods/score-bridge.js';
      doc.body.appendChild(s);
    } catch {}
  };

  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-lg border border-black/10 bg-board-light">
      {ready ? (
        <iframe
          src="/legacy-mods/v/current/index.html"
          title="Snake"
          onLoad={onIframeLoad}
          className="h-[70vh] min-h-[480px] w-full"
        />
      ) : (
        // Placeholder giữ chỗ để không gây layout shift (yêu cầu hiệu năng trong .docx)
        <div className="h-[70vh] min-h-[480px] w-full" />
      )}
    </div>
  );
}
