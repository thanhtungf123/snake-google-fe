'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminGet, adminSend } from '@/lib/adminApi';
import ConfirmModal from './ConfirmModal';

type ClaimStatus = 'pending_info' | 'info_submitted' | 'paid' | 'cancelled';

interface Payout {
  fullName?: string;
  bankName?: string;
  accountNumber?: string;
  phone?: string;
  note?: string;
}
interface ClaimRow {
  id: string;
  monthKey: string;
  rank: number;
  best: number;
  nickname: string;
  email: string | null;
  status: ClaimStatus;
  payout: Payout | null;
  submittedAt: string | null;
  paidAt: string | null;
  paidNote: string | null;
  createdAt: string | null;
}

const STATUS_META: Record<ClaimStatus, { label: string; cls: string }> = {
  pending_info: { label: 'Chờ nhập STK', cls: 'bg-yellow-100 text-yellow-700' },
  info_submitted: { label: 'Đã nhập STK', cls: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Đã trả', cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã huỷ', cls: 'bg-black/10 text-black/60' },
};

const STATUS_FILTERS: Array<{ value: ''; label: string } | { value: ClaimStatus; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending_info', label: STATUS_META.pending_info.label },
  { value: 'info_submitted', label: STATUS_META.info_submitted.label },
  { value: 'paid', label: STATUS_META.paid.label },
  { value: 'cancelled', label: STATUS_META.cancelled.label },
];

type Action =
  | { kind: 'paid'; row: ClaimRow }
  | { kind: 'cancelled'; row: ClaimRow }
  | { kind: 'reopen'; row: ClaimRow };

export default function AdminRewards() {
  const [rows, setRows] = useState<ClaimRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<'' | ClaimStatus>('');
  const [monthFilter, setMonthFilter] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<Action | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const qs = new URLSearchParams();
    if (statusFilter) qs.set('status', statusFilter);
    if (/^\d{4}-\d{2}$/.test(monthFilter)) qs.set('monthKey', monthFilter);
    const d = await adminGet<{ rows: ClaimRow[] }>(`/api/admin/rewards?${qs.toString()}`);
    setRows(d.rows);
  }, [statusFilter, monthFilter]);

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, [load]);

  async function runAction(note: string) {
    if (!action) return;
    const target: ClaimStatus =
      action.kind === 'paid'
        ? 'paid'
        : action.kind === 'cancelled'
          ? 'cancelled'
          : action.row.payout
            ? 'info_submitted'
            : 'pending_info';
    setAction(null);
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await adminSend(`/api/admin/rewards/${action.row.id}/status`, 'POST', {
        status: target,
        note: note || undefined,
      });
      setMsg(
        target === 'paid'
          ? `Đã đánh dấu trả thưởng cho ${action.row.nickname} (${action.row.monthKey}).`
          : target === 'cancelled'
            ? `Đã huỷ phiếu của ${action.row.nickname}.`
            : `Đã mở lại phiếu của ${action.row.nickname}.`
      );
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleString() : '—');

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Nhận thưởng</h2>
      <p className="text-sm opacity-70">
        Danh sách người thắng đã chốt. Người thắng tự điền số tài khoản; admin chuyển khoản tay rồi
        đánh dấu <b>Đã trả</b>. Thông tin tài khoản là dữ liệu nhạy cảm — chỉ admin xem.
      </p>

      <div className="flex flex-wrap gap-2">
        <input
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          placeholder="Lọc tháng (YYYY-MM)"
          className="rounded border border-black/15 px-3 py-1.5 text-sm outline-none focus:border-snake"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | ClaimStatus)}
          className="rounded border border-black/15 px-3 py-1.5 text-sm"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {err && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      {msg && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}

      <div className="overflow-x-auto rounded-lg border border-black/10">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="px-3 py-2">Tháng</th>
              <th className="px-3 py-2 text-right">Hạng</th>
              <th className="px-3 py-2">Người chơi</th>
              <th className="px-3 py-2">Thông tin nhận thưởng</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.map((c) => (
              <tr key={c.id} className="align-top">
                <td className="px-3 py-2 font-medium">{c.monthKey}</td>
                <td className="px-3 py-2 text-right tabular-nums">#{c.rank}</td>
                <td className="px-3 py-2">
                  <div className="font-medium">{c.nickname}</div>
                  {c.email && <div className="text-xs opacity-60">{c.email}</div>}
                </td>
                <td className="px-3 py-2">
                  {c.payout ? (
                    <div className="space-y-0.5">
                      <div>{c.payout.fullName}</div>
                      <div className="opacity-70">
                        {c.payout.bankName} ·{' '}
                        <span className="tabular-nums">{c.payout.accountNumber}</span>
                      </div>
                      {c.payout.phone && <div className="text-xs opacity-60">{c.payout.phone}</div>}
                      {c.payout.note && (
                        <div className="text-xs italic opacity-60">“{c.payout.note}”</div>
                      )}
                    </div>
                  ) : (
                    <span className="opacity-50">— chưa nhập —</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_META[c.status].cls}`}>
                    {STATUS_META[c.status].label}
                  </span>
                  {c.status === 'paid' && (
                    <div className="mt-1 text-xs opacity-60">{fmt(c.paidAt)}</div>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex flex-col items-end gap-1">
                    {(c.status === 'pending_info' || c.status === 'info_submitted') && (
                      <>
                        <button
                          onClick={() => setAction({ kind: 'paid', row: c })}
                          disabled={busy}
                          className="rounded bg-snake px-2 py-1 text-xs font-medium text-white disabled:opacity-60"
                        >
                          Đánh dấu đã trả
                        </button>
                        <button
                          onClick={() => setAction({ kind: 'cancelled', row: c })}
                          disabled={busy}
                          className="rounded bg-black/5 px-2 py-1 text-xs hover:bg-black/10"
                        >
                          Huỷ
                        </button>
                      </>
                    )}
                    {(c.status === 'paid' || c.status === 'cancelled') && (
                      <button
                        onClick={() => setAction({ kind: 'reopen', row: c })}
                        disabled={busy}
                        className="rounded bg-black/5 px-2 py-1 text-xs hover:bg-black/10"
                      >
                        Mở lại
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center opacity-60">
                  Chưa có phiếu nhận thưởng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={action?.kind === 'paid'}
        title={`Đánh dấu đã trả — ${action?.row.nickname ?? ''}`}
        message={`Xác nhận đã chuyển khoản thưởng ${action?.row.monthKey ?? ''} (hạng #${action?.row.rank ?? ''}). Người thắng sẽ nhận thông báo.`}
        reasonLabel="Ghi chú (mã giao dịch, ngày chuyển…)"
        confirmText="Xác nhận đã trả"
        onConfirm={runAction}
        onCancel={() => setAction(null)}
      />
      <ConfirmModal
        open={action?.kind === 'cancelled'}
        title={`Huỷ phiếu — ${action?.row.nickname ?? ''}`}
        message="Huỷ phiếu nhận thưởng này (vd tài khoản không hợp lệ)."
        reasonLabel="Lý do huỷ"
        reasonRequired
        confirmText="Huỷ phiếu"
        danger
        onConfirm={runAction}
        onCancel={() => setAction(null)}
      />
      <ConfirmModal
        open={action?.kind === 'reopen'}
        title={`Mở lại phiếu — ${action?.row.nickname ?? ''}`}
        message="Mở lại phiếu để chỉnh sửa / xử lý lại."
        confirmText="Mở lại"
        onConfirm={runAction}
        onCancel={() => setAction(null)}
      />
    </div>
  );
}
