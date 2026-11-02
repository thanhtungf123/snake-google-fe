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
  IconSearch,
} from './ui';

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
        <div className="relative min-w-[200px] flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ad-muted)]" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo nickname hoặc email…"
            className="pl-9"
          />
        </div>
        <Select
          value={statusF}
          onChange={(e) => {
            setSkip(0);
            setStatusF(e.target.value as StatusFilter);
          }}
          className="w-auto"
        >
          {(Object.keys(STATUS_LABEL) as StatusFilter[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <Select
          value={roleF}
          onChange={(e) => {
            setSkip(0);
            setRoleF(e.target.value as RoleFilter);
          }}
          className="w-auto"
        >
          {(Object.keys(ROLE_LABEL) as RoleFilter[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </Select>
        <Button type="submit">Tìm</Button>
      </form>

      {err && <p className="text-[var(--ad-danger)]">{err}</p>}

      <Table>
        <THead>
          <Tr hover={false}>
            <Th>Nickname</Th>
            <Th>Email</Th>
            <Th className="text-right">Best</Th>
            <Th className="text-right">Ván</Th>
            <Th>Trạng thái</Th>
            <Th className="text-right">Thao tác</Th>
          </Tr>
        </THead>
        <TBody>
          {rows.map((u) => (
            <Tr key={u.id}>
              <Td className="font-medium">
                <span className="inline-flex items-center gap-1.5">
                  {u.nickname}
                  {u.role === 'admin' && <Badge tone="accent">admin</Badge>}
                </span>
              </Td>
              <Td className="text-[var(--ad-muted)]">{u.email ?? '—'}</Td>
              <Td className="text-right tabular-nums">{u.personalBest}</Td>
              <Td className="text-right tabular-nums">{u.gamesPlayed}</Td>
              <Td>
                {u.status === 'banned' ? (
                  <Badge tone="danger" >
                    <span title={u.banReason ?? ''}>Bị khoá</span>
                  </Badge>
                ) : (
                  <Badge tone="success">Hoạt động</Badge>
                )}
              </Td>
              <Td className="text-right">
                {u.role === 'admin' ? (
                  <span className="text-[var(--ad-muted)] opacity-60">—</span>
                ) : u.status === 'banned' ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() => setModal({ type: 'unban', user: u })}
                  >
                    Mở khoá
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={busy}
                    onClick={() => setModal({ type: 'ban', user: u })}
                  >
                    Khoá
                  </Button>
                )}
              </Td>
            </Tr>
          ))}
          {rows.length === 0 && <TableEmpty colSpan={6}>Không có người dùng.</TableEmpty>}
        </TBody>
      </Table>

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

// Giữ re-export để các file cũ import { Pager } from './AdminUsers' vẫn chạy.
export { Pager } from './ui';
