'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminGet, adminSend } from '@/lib/adminApi';
import {
  Badge,
  Button,
  Card,
  Input,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  TableEmpty,
  TableSkeleton,
} from './ui';

interface SeasonRow {
  monthKey: string;
  status: 'open' | 'closed';
  closedAt: string | null;
  isCurrent: boolean;
  pendingFlagged: number;
  players: number;
}

interface BoardEntry {
  rank: number;
  userId: string;
  nickname: string;
  best: number;
}
interface Preview {
  monthKey: string;
  status: 'open' | 'closed';
  frozen: boolean;
  rewardTiers: number;
  total: number;
  rows: BoardEntry[];
  pendingFlagged: number;
}

export default function AdminSeasons() {
  const [rows, setRows] = useState<SeasonRow[]>([]);
  const [defaultTiers, setDefaultTiers] = useState(3);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [closeTarget, setCloseTarget] = useState<SeasonRow | null>(null);
  const [tiersInput, setTiersInput] = useState('3');
  const [forceChecked, setForceChecked] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    const d = await adminGet<{ defaultRewardTiers: number; rows: SeasonRow[] }>(
      '/api/admin/seasons'
    );
    setRows(d.rows);
    setDefaultTiers(d.defaultRewardTiers);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, [load]);

  async function openPreview(monthKey: string) {
    setErr(null);
    try {
      const d = await adminGet<Preview>(`/api/admin/seasons/${monthKey}/preview`);
      setPreview(d);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  // Mở popup chốt mùa giải.
  function openCloseModal(s: SeasonRow) {
    setErr(null);
    setMsg(null);
    setCloseTarget(s);
    setTiersInput(String(defaultTiers));
    setForceChecked(false);
  }

  async function confirmClose() {
    if (!closeTarget) return;
    const s = closeTarget;
    const rewardTiers = Number(tiersInput);
    if (!Number.isFinite(rewardTiers) || rewardTiers < 1) {
      setErr('Số bậc thưởng không hợp lệ');
      return;
    }
    const needsForce = s.pendingFlagged > 0 || s.isCurrent;
    const force = needsForce ? forceChecked : false;

    setCloseTarget(null);
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const r = await adminSend<{ winners: BoardEntry[]; rewardTiers: number }>(
        `/api/admin/seasons/${s.monthKey}/close`,
        'POST',
        { rewardTiers, force }
      );
      setMsg(
        `Đã chốt ${s.monthKey}: thưởng Top ${r.rewardTiers} (${r.winners.length} người đã nhận thông báo).`
      );
      setPreview(null);
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ad-muted)]">
        Chốt mùa giải sẽ đóng băng bảng xếp hạng (không đổi về sau) và gửi thông báo cho Top. Nên
        duyệt hết điểm nghi ngờ trước khi chốt.
      </p>

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

      {!loaded ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
      <Table minWidth={560}>
        <THead>
          <Tr hover={false}>
            <Th>Tháng</Th>
            <Th className="text-right">Người chơi</Th>
            <Th className="text-right">Điểm nghi ngờ</Th>
            <Th>Trạng thái</Th>
            <Th className="text-right">Hành động</Th>
          </Tr>
        </THead>
        <TBody>
          {rows.map((s) => (
            <Tr key={s.monthKey}>
              <Td className="font-medium">
                {s.monthKey}
                {s.isCurrent && (
                  <span className="ml-1 text-xs text-[var(--ad-muted)]">(hiện tại)</span>
                )}
              </Td>
              <Td className="text-right tabular-nums">{s.players}</Td>
              <Td className="text-right tabular-nums">
                {s.pendingFlagged > 0 ? (
                  <span className="text-[var(--ad-warn)]">{s.pendingFlagged}</span>
                ) : (
                  0
                )}
              </Td>
              <Td>
                {s.status === 'closed' ? (
                  <Badge tone="success">Đã chốt</Badge>
                ) : (
                  <Badge tone="neutral">Đang mở</Badge>
                )}
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => openPreview(s.monthKey)}>
                    Xem
                  </Button>
                  {s.status === 'open' && (
                    <Button size="sm" onClick={() => openCloseModal(s)} disabled={busy}>
                      Chốt
                    </Button>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
          {rows.length === 0 && <TableEmpty colSpan={5}>Chưa có mùa giải.</TableEmpty>}
        </TBody>
      </Table>
      )}

      {preview && (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">
              Top 10 — {preview.monthKey}{' '}
              <span className="text-sm font-normal text-[var(--ad-muted)]">
                ({preview.frozen ? 'đã đóng băng' : 'đang tính sống'} · {preview.total} người ·
                thưởng Top {preview.rewardTiers})
              </span>
            </h3>
            <button
              onClick={() => setPreview(null)}
              className="text-sm text-[var(--ad-muted)] hover:underline"
            >
              Đóng
            </button>
          </div>
          {preview.pendingFlagged > 0 && (
            <p className="mb-2 text-sm text-[var(--ad-warn)]">
              ⚠ Còn {preview.pendingFlagged} điểm nghi ngờ chưa duyệt.
            </p>
          )}
          <ol className="space-y-1 text-sm">
            {preview.rows.map((e) => (
              <li
                key={e.userId}
                className={`flex justify-between rounded px-2 py-1 ${
                  e.rank <= preview.rewardTiers
                    ? 'bg-[var(--ad-accent-weak)] font-medium text-[var(--ad-accent)]'
                    : ''
                }`}
              >
                <span>
                  #{e.rank} {e.nickname}
                </span>
                <span className="tabular-nums">{e.best}</span>
              </li>
            ))}
            {preview.rows.length === 0 && (
              <li className="text-[var(--ad-muted)]">Chưa có dữ liệu.</li>
            )}
          </ol>
        </Card>
      )}

      {closeTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setCloseTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[var(--ad-border)] bg-[var(--ad-surface)] p-5 text-[var(--ad-text)] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Chốt mùa giải {closeTarget.monthKey}</h3>
            <p className="mt-1 text-sm text-[var(--ad-muted)]">
              Chốt sẽ đóng băng bảng xếp hạng (không đổi về sau) và gửi thông báo cho Top.
            </p>

            <label className="mt-3 block">
              <span className="mb-1 block text-sm text-[var(--ad-muted)]">
                Số bậc được thưởng (Top mấy)?<span className="text-[var(--ad-danger)]"> *</span>
              </span>
              <Input
                type="number"
                min={1}
                value={tiersInput}
                onChange={(e) => setTiersInput(e.target.value)}
                autoFocus
              />
            </label>

            {closeTarget.pendingFlagged > 0 && (
              <div className="mt-3 rounded-lg bg-[var(--ad-warn-weak)] px-3 py-2 text-sm text-[var(--ad-warn)]">
                ⚠ Còn <b>{closeTarget.pendingFlagged}</b> điểm nghi ngờ chưa duyệt trong tháng này.
                Nên duyệt hết trước khi chốt.
              </div>
            )}
            {closeTarget.pendingFlagged === 0 && closeTarget.isCurrent && (
              <div className="mt-3 rounded-lg bg-[var(--ad-warn-weak)] px-3 py-2 text-sm text-[var(--ad-warn)]">
                ⚠ Đây là <b>tháng hiện tại</b>, chưa kết thúc. Chốt sớm sẽ đóng băng ngay bây giờ.
              </div>
            )}

            {(closeTarget.pendingFlagged > 0 || closeTarget.isCurrent) && (
              <label className="mt-3 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={forceChecked}
                  onChange={(e) => setForceChecked(e.target.checked)}
                  className="mt-0.5"
                />
                <span>Tôi hiểu cảnh báo trên và vẫn muốn chốt (force).</span>
              </label>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCloseTarget(null)}>
                Hủy
              </Button>
              <Button
                onClick={confirmClose}
                disabled={(closeTarget.pendingFlagged > 0 || closeTarget.isCurrent) && !forceChecked}
              >
                Chốt mùa giải
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
