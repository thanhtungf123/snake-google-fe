'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminGet, adminSend } from '@/lib/adminApi';
import { Pager } from './AdminUsers';
import ConfirmModal from './ConfirmModal';

interface Row {
  id: string;
  userId: string;
  nickname: string;
  isGuest: boolean;
  score: number;
  durationMs: number;
  status: 'valid' | 'flagged' | 'rejected';
  rejectedReason: string | null;
  playedAt: string | null;
}

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

  const statusColor = (s: Row['status']) =>
    s === 'valid' ? 'text-green-600' : s === 'flagged' ? 'text-yellow-600' : 'text-red-600';

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
            className={`rounded-full px-3 py-1 text-sm ${
              f === filter ? 'bg-snake text-white' : 'bg-black/5 hover:bg-black/10'
            }`}
          >
            {FILTER_LABEL[f]}
          </button>
        ))}
        <select
          value={guestF}
          onChange={(e) => {
            setSkip(0);
            setGuestF(e.target.value as GuestFilter);
          }}
          className="ml-auto rounded border border-black/15 px-2 py-1.5 text-sm"
        >
          {(Object.keys(GUEST_LABEL) as GuestFilter[]).map((g) => (
            <option key={g} value={g}>
              {GUEST_LABEL[g]}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={search} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo nickname người chơi…"
          className="flex-1 rounded border border-black/15 px-3 py-2 text-sm"
        />
        <button className="rounded bg-snake px-4 py-2 text-sm font-semibold text-white">Tìm</button>
      </form>

      {err && <p className="text-red-600">{err}</p>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 opacity-60">
              <th className="py-2 pr-3">Người chơi</th>
              <th className="py-2 pr-3">Điểm</th>
              <th className="py-2 pr-3">Thời lượng</th>
              <th className="py-2 pr-3">Trạng thái</th>
              <th className="py-2 pr-3">Lúc</th>
              <th className="py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-black/5">
                <td className="py-2 pr-3">
                  {s.nickname}
                  {s.isGuest && <span className="ml-1 text-xs opacity-50">(khách)</span>}
                </td>
                <td className="py-2 pr-3 font-semibold tabular-nums">{s.score}</td>
                <td className="py-2 pr-3 tabular-nums opacity-70">{Math.round(s.durationMs / 1000)}s</td>
                <td className={`py-2 pr-3 ${statusColor(s.status)}`} title={s.rejectedReason ?? ''}>
                  {FILTER_LABEL[s.status]}
                </td>
                <td className="py-2 pr-3 opacity-60">
                  {s.playedAt ? new Date(s.playedAt).toLocaleString('vi-VN') : '—'}
                </td>
                <td className="py-2 text-right">
                  <div className="flex justify-end gap-1">
                    {s.status !== 'valid' && (
                      <button
                        disabled={busy}
                        onClick={() => setModal({ type: 'accept', score: s })}
                        className="rounded bg-black/5 px-2 py-1 hover:bg-black/10 disabled:opacity-50"
                      >
                        Chấp nhận
                      </button>
                    )}
                    {s.status !== 'rejected' && (
                      <button
                        disabled={busy}
                        onClick={() => setModal({ type: 'reject', score: s })}
                        className="rounded bg-red-600 px-2 py-1 text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Loại
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center opacity-60">
                  Không có điểm nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
