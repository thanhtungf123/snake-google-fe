'use client';

import { useState } from 'react';
import AdminPages from './AdminPages';
import AdminContent from './AdminContent';

// Gộp quản lý trang vào một chỗ: "Trang tùy chỉnh" (admin tự tạo) + "Trang hệ thống"
// (trang chủ & phần thưởng — chỉ chỉnh nội dung/SEO, không tạo/xoá được).
type Sub = 'custom' | 'system';

export default function AdminPagesManager() {
  const [sub, setSub] = useState<Sub>('custom');

  const tab = (key: Sub, label: string) => (
    <button
      onClick={() => setSub(key)}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        sub === key
          ? 'bg-[var(--ad-accent)] text-[var(--ad-on-accent)]'
          : 'border border-[var(--ad-border)] bg-[var(--ad-surface)] text-[var(--ad-muted)] hover:bg-[var(--ad-hover)]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {tab('custom', 'Trang tùy chỉnh')}
        {tab('system', 'Trang hệ thống (Trang chủ, Phần thưởng)')}
      </div>
      {sub === 'custom' ? <AdminPages /> : <AdminContent />}
    </div>
  );
}
