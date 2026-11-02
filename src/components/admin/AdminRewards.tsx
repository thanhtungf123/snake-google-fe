'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminGet, adminSend } from '@/lib/adminApi';
import ConfirmModal from './ConfirmModal';
import {
  Badge,
  Button,
  Input,
  Select,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  TableEmpty,
} from './ui';

type ClaimStatus = 'pending_info' | 'info_submitted' | 'paid' | 'cancelled';
type Tone = 'neutral' | 'accent' | 'success' | 'warn' | 'danger';

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

const STATUS_META: Record<ClaimStatus, { label: string; tone: Tone }> = {
  pending_info: { label: 'Chờ nhập STK', tone: 'warn' },
  info_submitted: { label: 'Đã nhập STK', tone: 'accent' },
  paid: { label: 'Đã trả', tone: 'success' },
  cancelled: { label: 'Đã huỷ', tone: 'neutral' },
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
      <p className="text-sm text-[var(--ad-muted)]">
        Danh sách người thắng đã chốt. Người thắng tự điền số tài khoản; admin chuyển khoản tay rồi
        đánh dấu <b>Đã trả</b>. Thông tin tài khoản là dữ liệu nhạy cảm — chỉ admin xem.
      </p>

      <div className="flex flex-wrap gap-2">
        <Input
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          placeholder="Lọc tháng (YYYY-MM)"
          className="w-auto"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | ClaimStatus)}
          className="w-auto"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
      </div>

      {err && (
        <p className="rounded-lg bg-[var(--ad-danger-weak)] px-3 py-2 text-sm text-[var(--ad-danger)]">
          {err}
        </p>
      )}
      {msg && (
        <p className="rounded-lg bg-[var(--ad-ok-weak)] px-3 py-2 text-sm text-[var(--ad-ok)]">
          {msg}
        </p>
      )}

      <Table minWidth={760}>
        <THead>
          <Tr hover={false}>
            <Th>Tháng</Th>
            <Th className="text-right">Hạng</Th>
            <Th>Người chơi</Th>
            <Th>Thông tin nhận thưởng</Th>
            <Th>Trạng thái</Th>
            <Th className="text-right">Thao tác</Th>
          </Tr>
        </THead>
        <TBody>
          {rows.map((c) => (
            <Tr key={c.id} className="align-top">
              <Td className="font-medium">{c.monthKey}</Td>
              <Td className="text-right tabular-nums">#{c.rank}</Td>
              <Td>
                <div className="font-medium">{c.nickname}</div>
                {c.email && <div className="text-xs text-[var(--ad-muted)]">{c.email}</div>}
              </Td>
              <Td>
                {c.payout ? (
                  <div className="space-y-0.5">
                    <div>{c.payout.fullName}</div>
                    <div className="text-[var(--ad-muted)]">
                      {c.payout.bankName} ·{' '}
                      <span className="tabular-nums">{c.payout.accountNumber}</span>
                    </div>
                    {c.payout.phone && (
                      <div className="text-xs text-[var(--ad-muted)]">{c.payout.phone}</div>
                    )}
                    {c.payout.note && (
                      <div className="text-xs italic text-[var(--ad-muted)]">“{c.payout.note}”</div>
                    )}
                  </div>
                ) : (
                  <span className="text-[var(--ad-muted)]">— chưa nhập —</span>
                )}
              </Td>
              <Td>
                <Badge tone={STATUS_META[c.status].tone}>{STATUS_META[c.status].label}</Badge>
                {c.status === 'paid' && (
                  <div className="mt-1 text-xs text-[var(--ad-muted)]">{fmt(c.paidAt)}</div>
                )}
              </Td>
              <Td className="text-right">
                <div className="flex flex-col items-end gap-1.5">
                  {(c.status === 'pending_info' || c.status === 'info_submitted') && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => setAction({ kind: 'paid', row: c })}
                        disabled={busy}
                      >
                        Đánh dấu đã trả
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setAction({ kind: 'cancelled', row: c })}
                        disabled={busy}
                      >
                        Huỷ
                      </Button>
                    </>
                  )}
                  {(c.status === 'paid' || c.status === 'cancelled') && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setAction({ kind: 'reopen', row: c })}
                      disabled={busy}
                    >
                      Mở lại
                    </Button>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
          {rows.length === 0 && (
            <TableEmpty colSpan={6}>Chưa có phiếu nhận thưởng nào.</TableEmpty>
          )}
        </TBody>
      </Table>

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
