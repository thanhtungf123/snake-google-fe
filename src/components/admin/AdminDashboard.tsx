'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminGet } from '@/lib/adminApi';

interface Stats {
  users: number;
  guests: number;
  banned: number;
  scores: number;
  flagged: number;
  rejected: number;
  gamesToday: number;
}
interface AuditRow {
  id: string;
  actor: string;
  action: string;
  targetType: string;
  reason: string | null;
  meta: Record<string, unknown> | null;
  at: string | null;
}

type AuditFilter = 'all' | 'user' | 'score' | 'tournament' | 'content' | 'page';
const AUDIT_FILTER_LABEL: Record<AuditFilter, string> = {
  all: 'Tất cả',
  user: 'Người dùng',
  score: 'Điểm',
  tournament: 'Mùa giải',
  content: 'Nội dung',
  page: 'Trang',
};

// Diễn giải một dòng nhật ký thành câu dễ đọc tiếng Việt.
function describe(a: AuditRow): string {
  const m = a.meta ?? {};
  const nick = typeof m.nickname === 'string' ? `"${m.nickname}"` : '';
  const score = m.score != null ? ` ${m.score}` : '';
  switch (a.action) {
    case 'user.ban':
      return `cấm người dùng ${nick}`;
    case 'user.unban':
      return `mở khoá người dùng ${nick}`;
    case 'score.status': {
      const to = m.to;
      if (to === 'rejected') return `loại điểm${score} của ${nick}`;
      if (to === 'valid') return `gỡ/khôi phục điểm${score} của ${nick}`;
      if (to === 'flagged') return `đánh dấu nghi ngờ điểm${score} của ${nick}`;
      return `đổi trạng thái điểm${score} của ${nick}`;
    }
    case 'season.close': {
      const mk = m.monthKey ?? '';
      const tiers = m.rewardTiers != null ? `, thưởng Top ${m.rewardTiers}` : '';
      return `chốt mùa giải tháng ${mk}${tiers}`;
    }
    case 'content.upsert':
      return `cập nhật nội dung ${m.pageKey ?? ''}/${m.locale ?? ''}`;
    case 'page.create':
      return `tạo trang "${m.slug ?? ''}"`;
    case 'page.update':
      return `sửa trang "${m.slug ?? ''}"`;
    case 'page.delete':
      return `xoá trang "${m.slug ?? ''}"`;
    default:
      return `${a.action} (${a.targetType})`;
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [auditF, setAuditF] = useState<AuditFilter>('all');
  const [err, setErr] = useState<string | null>(null);

  const loadAudit = useCallback((f: AuditFilter) => {
    const qs = new URLSearchParams({ limit: '20' });
    if (f !== 'all') qs.set('targetType', f);
    adminGet<{ rows: AuditRow[] }>(`/api/admin/audit?${qs}`)
      .then((d) => setAudit(d.rows))
      .catch(() => {});
  }, []);

  useEffect(() => {
    adminGet<{ stats: Stats }>('/api/admin/stats')
      .then((d) => setStats(d.stats))
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    loadAudit(auditF);
  }, [auditF, loadAudit]);

  if (err) return <p className="text-red-600">{err}</p>;
  if (!stats) return <p className="opacity-60">Đang tải…</p>;

  const cards: [string, number, string?][] = [
    ['Người dùng', stats.users],
    ['Khách (guest)', stats.guests],
    ['Bị khoá', stats.banned, stats.banned > 0 ? 'text-red-600' : undefined],
    ['Tổng số điểm', stats.scores],
    ['Ván hôm nay', stats.gamesToday],
    ['Điểm nghi ngờ', stats.flagged, stats.flagged > 0 ? 'text-yellow-600' : undefined],
    ['Điểm bị loại', stats.rejected],
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map(([label, value, color]) => (
          <div key={label} className="rounded-lg bg-black/5 p-4 text-center">
            <div className={`text-2xl font-bold tabular-nums ${color ?? ''}`}>{value}</div>
            <div className="text-xs opacity-60">{label}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Nhật ký quản trị gần đây</h2>
          <select
            value={auditF}
            onChange={(e) => setAuditF(e.target.value as AuditFilter)}
            className="rounded border border-black/15 px-2 py-1 text-sm"
          >
            {(Object.keys(AUDIT_FILTER_LABEL) as AuditFilter[]).map((f) => (
              <option key={f} value={f}>
                {AUDIT_FILTER_LABEL[f]}
              </option>
            ))}
          </select>
        </div>
        {audit.length === 0 ? (
          <p className="opacity-60">Chưa có hoạt động nào.</p>
        ) : (
          <ul className="divide-y divide-black/10 text-sm">
            {audit.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline gap-x-2 py-2">
                <span className="font-medium">{a.actor}</span>
                <span>{describe(a)}</span>
                {a.reason && <span className="opacity-60">— {a.reason}</span>}
                <span className="ml-auto whitespace-nowrap opacity-50">
                  {a.at ? new Date(a.at).toLocaleString('vi-VN') : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
