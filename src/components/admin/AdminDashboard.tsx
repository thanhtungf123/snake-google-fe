'use client';

import { useEffect, useState } from 'react';
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
  at: string | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    adminGet<{ stats: Stats }>('/api/admin/stats')
      .then((d) => setStats(d.stats))
      .catch((e) => setErr(e.message));
    adminGet<{ rows: AuditRow[] }>('/api/admin/audit?limit=15')
      .then((d) => setAudit(d.rows))
      .catch(() => {});
  }, []);

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
        <h2 className="mb-2 text-lg font-semibold">Nhật ký quản trị gần đây</h2>
        {audit.length === 0 ? (
          <p className="opacity-60">Chưa có hoạt động nào.</p>
        ) : (
          <ul className="divide-y divide-black/10 text-sm">
            {audit.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-2 py-2">
                <span className="font-medium">{a.actor}</span>
                <span className="rounded bg-black/5 px-2 py-0.5 text-xs">{a.action}</span>
                <span className="opacity-60">{a.targetType}</span>
                {a.reason && <span className="opacity-60">— {a.reason}</span>}
                <span className="ml-auto opacity-50">
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
