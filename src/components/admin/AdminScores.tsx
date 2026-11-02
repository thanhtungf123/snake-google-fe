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
  Pager,
} from './ui';

interface Row {
  id: string;
  userId: string;
  nickname: string;
  isGuest: boolean;
  score: number;
  durationMs: number;
  status: 'valid' | 'flagged' | 'rejected';
  rejectedReason: string | null;
  flags: string[];
  ipHash: string | null;
  playedAt: string | null;
}

// Nhãn tiếng Việt cho các cờ anti-cheat (khớp ScoreFlag ở backend).
const FLAG_LABEL: Record<string, string> = {
  impossible: 'Bất khả thi',
  too_fast: 'Quá nhanh',
  too_short: 'Quá ngắn',
  pb_spike: 'Nhảy vọt',
  global_outlier: 'Vượt mặt bằng',
};

type Filter = 'all' | 'valid' | 'flagged' | 'rejected';
const FILTERS: Filter[] = ['all', 'flagged', 'valid', 'rejected'];
const FILTER_LABEL: Record<Filter, string> = {
  all: 'Tất cả',
  valid: 'Hợp lệ',
  flagged: 'Nghi ngờ',
  rejected: 'Bị loại',
};
type GuestFilter = 'all' | 'exclude' | 'only';
const GUEST_LABEL: Record<GuestFilter, string> = {
  all: 'Tất cả',
  exclude: 'Chỉ người dùng',
  only: 'Chỉ khách',
};
const PAGE = 25;

// Tông Badge theo trạng thái điểm.
const STATUS_TONE: Record<Row['status'], 'success' | 'warn' | 'danger'> = {
  valid: 'success',
  flagged: 'warn',
  rejected: 'danger',
};

export default function AdminScores() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [filter, setFilter] = useState<Filter>('flagged');
  const [guestF, setGuestF] = useState<GuestFilter>('all');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [modal, setModal] = useState<{ type: 'reject' | 'accept'; score: Row } | null>(null);

  const load = useCallback(async (f: Filter, sk: number, guest: GuestFilter, query: string) => {
    setErr(null);
    const qs = new URLSearchParams({ skip: String(sk), limit: String(PAGE) });
    if (f !== 'all') qs.set('status', f);
    if (guest !== 'all') qs.set('guest', guest);
    if (query) qs.set('q', query);
    const d = await adminGet<{ rows: Row[]; total: number }>(`/api/admin/scores?${qs}`);
    setRows(d.rows);
    setTotal(d.total);
  }, []);

  useEffect(() => {
    load(filter, skip, guestF, q).catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, skip, guestF]);

  function search(e: React.FormEvent) {
    e.preventDefault();
    setSkip(0);
    load(filter, 0, guestF, q).catch((er) => setErr(er.message));
  }

  async function doAction(reason: string) {
    if (!modal) return;
    const { type, score } = modal;
    const status: Row['status'] = type === 'reject' ? 'rejected' : 'valid';
    setModal(null);
    setBusy(true);
    try {
      await adminSend(`/api/admin/scores/${score.id}/status`, 'POST', { status, reason });
      await load(filter, skip, guestF, q);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => {
              setSkip(0);
              setFilter(f);
            }}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              f === filter
                ? 'bg-[var(--ad-accent)] text-[var(--ad-on-accent)]'
                : 'bg-[var(--ad-surface)] text-[var(--ad-muted)] border border-[var(--ad-border)] hover:bg-[var(--ad-hover)]'
            }`}
          >
            {FILTER_LABEL[f]}
          </button>
        ))}
        <Select
          value={guestF}
          onChange={(e) => {
            setSkip(0);
            setGuestF(e.target.value as GuestFilter);
          }}
          className="ml-auto w-auto"
        >
          {(Object.keys(GUEST_LABEL) as GuestFilter[]).map((g) => (
            <option key={g} value={g}>
              {GUEST_LABEL[g]}
            </option>
          ))}
        </Select>
      </div>

      <form onSubmit={search} className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo nickname người chơi…"
          className="flex-1"
        />
        <Button type="submit">Tìm</Button>
      </form>

      {err && <p className="text-[var(--ad-danger)]">{err}</p>}

      <Table>
        <THead>
          <Tr hover={false}>
            <Th>Người chơi</Th>
            <Th className="text-right">Điểm</Th>
            <Th className="text-right">Thời lượng</Th>
            <Th>Trạng thái</Th>
            <Th>Lúc</Th>
            <Th className="text-right">Thao tác</Th>
          </Tr>
        </THead>
        <TBody>
          {rows.map((s) => (
            <Tr key={s.id}>
              <Td>
                {s.nickname}
                {s.isGuest && <span className="ml-1 text-xs text-[var(--ad-muted)]">(khách)</span>}
              </Td>
              <Td className="text-right font-semibold tabular-nums">{s.score}</Td>
              <Td className="text-right tabular-nums text-[var(--ad-muted)]">
                {Math.round(s.durationMs / 1000)}s
              </Td>
              <Td>
                <Badge tone={STATUS_TONE[s.status]}>
                  <span title={s.rejectedReason ?? ''}>{FILTER_LABEL[s.status]}</span>
                </Badge>
                {s.flags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.flags.map((f) => (
                      <span
                        key={f}
                        className="rounded bg-[var(--ad-warn-weak)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--ad-warn)]"
                        title={s.rejectedReason ?? ''}
                      >
                        {FLAG_LABEL[f] ?? f}
                      </span>
                    ))}
                  </div>
                )}
              </Td>
              <Td className="whitespace-nowrap text-[var(--ad-muted)]">
                {s.playedAt ? new Date(s.playedAt).toLocaleString('vi-VN') : '—'}
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-1.5">
                  {s.status !== 'valid' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => setModal({ type: 'accept', score: s })}
                    >
                      Chấp nhận
                    </Button>
                  )}
                  {s.status !== 'rejected' && (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={busy}
                      onClick={() => setModal({ type: 'reject', score: s })}
                    >
                      Loại
                    </Button>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
          {rows.length === 0 && <TableEmpty colSpan={6}>Không có điểm nào.</TableEmpty>}
        </TBody>
      </Table>

      <Pager total={total} skip={skip} page={PAGE} onChange={setSkip} />

      <ConfirmModal
        open={modal?.type === 'reject'}
        title={`Loại điểm ${modal?.score.score ?? ''} của "${modal?.score.nickname ?? ''}"?`}
        message="Điểm bị loại sẽ không tính vào bảng xếp hạng. Vui lòng nhập lý do."
        reasonLabel="Lý do loại điểm"
        reasonRequired
        reasonDefault="Gian lận"
        confirmText="Loại điểm"
        danger
        onConfirm={doAction}
        onCancel={() => setModal(null)}
      />
      <ConfirmModal
        open={modal?.type === 'accept'}
        title={`Gỡ/khôi phục điểm ${modal?.score.score ?? ''} của "${modal?.score.nickname ?? ''}"?`}
        message="Điểm sẽ được tính lại vào bảng xếp hạng. Vui lòng nhập lý do gỡ."
        reasonLabel="Lý do gỡ điểm"
        reasonRequired
        confirmText="Gỡ điểm"
        onConfirm={doAction}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
