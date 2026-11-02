'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminGet } from '@/lib/adminApi';
import {
  Card,
  CardHeader,
  StatCard,
  Select,
  BarChart,
  DonutChart,
  type BarDatum,
  IconUsers,
  IconTrophy,
  IconGamepad,
  IconCalendar,
} from './ui';

interface Stats {
  users: number;
  guests: number;
  banned: number;
  scores: number;
  valid: number;
  flagged: number;
  rejected: number;
  gamesToday: number;
}
interface SeriesPoint {
  day: string; // YYYY-MM-DD
  games: number;
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
    case 'settings.update':
      return 'cập nhật cấu hình site';
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

// Màu chấm timeline theo nhóm hành động.
function auditDot(a: AuditRow): string {
  if (a.action === 'user.ban' || a.action.endsWith('.delete')) return 'var(--ad-danger)';
  if (a.action === 'score.status') {
    if (a.meta?.to === 'rejected') return 'var(--ad-danger)';
    if (a.meta?.to === 'flagged') return 'var(--ad-warn)';
    return 'var(--ad-ok)';
  }
  if (a.action === 'season.close' || a.action === 'user.unban') return 'var(--ad-ok)';
  return 'var(--ad-accent)';
}

// 'YYYY-MM-DD' -> { short: 'DD', label: 'DD/MM' }
function fmtDay(day: string): { short: string; label: string } {
  const [, mm, dd] = day.split('-');
  return { short: dd, label: `${dd}/${mm}` };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
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
    adminGet<{ stats: Stats; series: SeriesPoint[] }>('/api/admin/stats')
      .then((d) => {
        setStats(d.stats);
        setSeries(d.series ?? []);
      })
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    loadAudit(auditF);
  }, [auditF, loadAudit]);

  if (err) return <p className="text-[var(--ad-danger)]">{err}</p>;
  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  const bars: BarDatum[] = series.map((p) => {
    const f = fmtDay(p.day);
    return { short: f.short, label: f.label, value: p.games };
  });
  const totalGames14 = series.reduce((s, p) => s + p.games, 0);

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Người dùng" value={stats.users} tone="accent" icon={<IconUsers />} />
        <StatCard label="Khách (guest)" value={stats.guests} icon={<IconUsers />} />
        <StatCard
          label="Bị khoá"
          value={stats.banned}
          tone={stats.banned > 0 ? 'danger' : 'neutral'}
          icon={<IconUsers />}
        />
        <StatCard label="Ván hôm nay" value={stats.gamesToday} tone="success" icon={<IconGamepad />} />
        <StatCard label="Tổng số điểm" value={stats.scores} icon={<IconTrophy />} />
        <StatCard label="Điểm hợp lệ" value={stats.valid} tone="success" icon={<IconTrophy />} />
        <StatCard
          label="Điểm nghi ngờ"
          value={stats.flagged}
          tone={stats.flagged > 0 ? 'warn' : 'neutral'}
          icon={<IconTrophy />}
        />
        <StatCard
          label="Điểm bị loại"
          value={stats.rejected}
          tone={stats.rejected > 0 ? 'danger' : 'neutral'}
          icon={<IconTrophy />}
        />
      </div>

      {/* Biểu đồ */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Ván chơi 14 ngày gần đây"
            description={`Tổng ${totalGames14} ván trong 14 ngày`}
            actions={<IconCalendar className="h-5 w-5 text-[var(--ad-muted)]" />}
          />
          <div className="mt-4">
            {bars.length ? (
              <BarChart data={bars} />
            ) : (
              <p className="py-10 text-center text-[var(--ad-muted)]">Chưa có dữ liệu.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Phân loại điểm" description="Theo trạng thái kiểm duyệt" />
          <div className="mt-4">
            <DonutChart
              segments={[
                { label: 'Hợp lệ', value: stats.valid, color: 'var(--ad-ok)' },
                { label: 'Nghi ngờ', value: stats.flagged, color: 'var(--ad-warn)' },
                { label: 'Bị loại', value: stats.rejected, color: 'var(--ad-danger)' },
              ]}
            />
          </div>
        </Card>
      </div>

      {/* Nhật ký */}
      <Card>
        <CardHeader
          title="Nhật ký quản trị gần đây"
          actions={
            <Select
              value={auditF}
              onChange={(e) => setAuditF(e.target.value as AuditFilter)}
              className="w-auto"
            >
              {(Object.keys(AUDIT_FILTER_LABEL) as AuditFilter[]).map((f) => (
                <option key={f} value={f}>
                  {AUDIT_FILTER_LABEL[f]}
                </option>
              ))}
            </Select>
          }
        />
        <div className="mt-4">
          {audit.length === 0 ? (
            <p className="py-6 text-center text-[var(--ad-muted)]">Chưa có hoạt động nào.</p>
          ) : (
            <ul className="space-y-0.5">
              {audit.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-[var(--ad-hover)]"
                >
                  <span
                    className="mt-1.5 inline-block h-2 w-2 shrink-0 self-start rounded-full"
                    style={{ background: auditDot(a) }}
                  />
                  <span className="font-medium">{a.actor}</span>
                  <span>{describe(a)}</span>
                  {a.reason && <span className="text-[var(--ad-muted)]">— {a.reason}</span>}
                  <span className="ml-auto whitespace-nowrap text-xs text-[var(--ad-muted)]">
                    {a.at ? new Date(a.at).toLocaleString('vi-VN') : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
