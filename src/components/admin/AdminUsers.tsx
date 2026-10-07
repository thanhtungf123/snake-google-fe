'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminGet, adminSend } from '@/lib/adminApi';
import ConfirmModal from './ConfirmModal';

interface Row {
  id: string;
  nickname: string;
  email: string | null;
  role: 'user' | 'admin';
  status: 'active' | 'banned';
  banReason: string | null;
  personalBest: number;
  gamesPlayed: number;
  joinedAt: string | null;
}

type StatusFilter = 'all' | 'active' | 'banned';
type RoleFilter = 'all' | 'user' | 'admin';
const STATUS_LABEL: Record<StatusFilter, string> = { all: 'Tất cả', active: 'Hoạt động', banned: 'Bị khoá' };
const ROLE_LABEL: Record<RoleFilter, string> = { all: 'Mọi vai trò', user: 'Người dùng', admin: 'Admin' };
const PAGE = 25;

export default function AdminUsers() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState<StatusFilter>('all');
  const [roleF, setRoleF] = useState<RoleFilter>('all');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [modal, setModal] = useState<{ type: 'ban' | 'unban'; user: Row } | null>(null);

  const load = useCallback(
    async (query: string, sk: number, status: StatusFilter, role: RoleFilter) => {
      setErr(null);
      const qs = new URLSearchParams({ skip: String(sk), limit: String(PAGE) });
      if (query) qs.set('q', query);
      if (status !== 'all') qs.set('status', status);
      if (role !== 'all') qs.set('role', role);
      const d = await adminGet<{ rows: Row[]; total: number }>(`/api/admin/users?${qs}`);
      setRows(d.rows);
      setTotal(d.total);
    },
    []
  );

  useEffect(() => {
    load(q, skip, statusF, roleF).catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, statusF, roleF]);

  function search(e: React.FormEvent) {
    e.preventDefault();
    setSkip(0);
    load(q, 0, statusF, roleF).catch((er) => setErr(er.message));
  }

  async function doAction(reason: string) {
    if (!modal) return;
    const { type, user } = modal;
    setModal(null);
    setBusy(true);
    try {
      await adminSend(`/api/admin/users/${user.id}/${type}`, 'POST', { reason: reason || undefined });
      await load(q, skip, statusF, roleF);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={search} className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo nickname hoặc email…"
          className="flex-1 rounded border border-black/15 px-3 py-2 text-sm"
        />
        <select
          value={statusF}
          onChange={(e) => {
            setSkip(0);
            setStatusF(e.target.value as StatusFilter);
          }}
          className="rounded border border-black/15 px-2 py-2 text-sm"
        >
          {(Object.keys(STATUS_LABEL) as StatusFilter[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          value={roleF}
          onChange={(e) => {
            setSkip(0);
            setRoleF(e.target.value as RoleFilter);
          }}
          className="rounded border border-black/15 px-2 py-2 text-sm"
        >
          {(Object.keys(ROLE_LABEL) as RoleFilter[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        <button className="rounded bg-snake px-4 py-2 text-sm font-semibold text-white">Tìm</button>
      </form>

      {err && <p className="text-red-600">{err}</p>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 opacity-60">
              <th className="py-2 pr-3">Nickname</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Best</th>
              <th className="py-2 pr-3">Ván</th>
              <th className="py-2 pr-3">Trạng thái</th>
              <th className="py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-black/5">
                <td className="py-2 pr-3 font-medium">
                  {u.nickname}
                  {u.role === 'admin' && (
                    <span className="ml-1 rounded bg-snake/15 px-1.5 text-xs text-snake">admin</span>
                  )}
                </td>
                <td className="py-2 pr-3 opacity-70">{u.email ?? '—'}</td>
                <td className="py-2 pr-3 tabular-nums">{u.personalBest}</td>
                <td className="py-2 pr-3 tabular-nums">{u.gamesPlayed}</td>
                <td className="py-2 pr-3">
                  {u.status === 'banned' ? (
                    <span className="text-red-600" title={u.banReason ?? ''}>
                      Bị khoá
                    </span>
                  ) : (
                    <span className="text-green-600">Hoạt động</span>
                  )}
                </td>
                <td className="py-2 text-right">
                  {u.role === 'admin' ? (
                    <span className="opacity-40">—</span>
                  ) : u.status === 'banned' ? (
                    <button
                      disabled={busy}
                      onClick={() => setModal({ type: 'unban', user: u })}
                      className="rounded bg-black/5 px-3 py-1 hover:bg-black/10 disabled:opacity-50"
                    >
                      Mở khoá
                    </button>
                  ) : (
                    <button
                      disabled={busy}
                      onClick={() => setModal({ type: 'ban', user: u })}
                      className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Khoá
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center opacity-60">
                  Không có người dùng.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pager total={total} skip={skip} page={PAGE} onChange={setSkip} />

      <ConfirmModal
        open={modal?.type === 'ban'}
        title={`Khoá người dùng "${modal?.user.nickname ?? ''}"?`}
        message="Người dùng sẽ không đăng nhập được. Vui lòng nhập lý do."
        reasonLabel="Lý do khoá"
        reasonRequired
        confirmText="Khoá"
        danger
        onConfirm={doAction}
        onCancel={() => setModal(null)}
      />
      <ConfirmModal
        open={modal?.type === 'unban'}
        title={`Mở khoá người dùng "${modal?.user.nickname ?? ''}"?`}
        message="Người dùng sẽ đăng nhập lại được bình thường."
        reasonLabel="Lý do mở khoá (tuỳ chọn)"
        confirmText="Mở khoá"
        onConfirm={doAction}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}

export function Pager({
  total,
  skip,
  page,
  onChange,
}: {
  total: number;
  skip: number;
  page: number;
  onChange: (skip: number) => void;
}) {
  const from = total === 0 ? 0 : skip + 1;
  const to = Math.min(skip + page, total);
  return (
    <div className="flex items-center justify-between pt-2 text-sm opacity-70">
      <span>
        {from}–{to} / {total}
      </span>
      <div className="flex gap-2">
        <button
          disabled={skip === 0}
          onClick={() => onChange(Math.max(0, skip - page))}
          className="rounded bg-black/5 px-3 py-1 hover:bg-black/10 disabled:opacity-40"
        >
          ← Trước
        </button>
        <button
          disabled={to >= total}
          onClick={() => onChange(skip + page)}
          className="rounded bg-black/5 px-3 py-1 hover:bg-black/10 disabled:opacity-40"
        >
          Sau →
        </button>
      </div>
    </div>
  );
}
