'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminGet, adminSend } from '@/lib/adminApi';

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
      <h2 className="text-xl font-semibold">Mùa giải (theo tháng)</h2>
      <p className="text-sm opacity-70">
        Chốt mùa giải sẽ đóng băng bảng xếp hạng (không đổi về sau) và gửi thông báo cho Top. Nên
        duyệt hết điểm nghi ngờ trước khi chốt.
      </p>

      {err && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      {msg && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}

      <div className="overflow-x-auto rounded-lg border border-black/10">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="px-3 py-2">Tháng</th>
              <th className="px-3 py-2 text-right">Người chơi</th>
              <th className="px-3 py-2 text-right">Điểm nghi ngờ</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.map((s) => (
              <tr key={s.monthKey}>
                <td className="px-3 py-2 font-medium">
                  {s.monthKey}
                  {s.isCurrent && <span className="ml-1 text-xs opacity-60">(hiện tại)</span>}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{s.players}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {s.pendingFlagged > 0 ? (
                    <span className="text-yellow-600">{s.pendingFlagged}</span>
                  ) : (
                    0
                  )}
                </td>
                <td className="px-3 py-2">
                  {s.status === 'closed' ? (
                    <span className="text-green-600">Đã chốt</span>
                  ) : (
                    <span className="opacity-70">Đang mở</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openPreview(s.monthKey)}
                      className="rounded bg-black/5 px-2 py-1 text-xs hover:bg-black/10"
                    >
                      Xem
                    </button>
                    {s.status === 'open' && (
                      <button
                        onClick={() => openCloseModal(s)}
                        disabled={busy}
                        className="rounded bg-snake px-2 py-1 text-xs font-medium text-white disabled:opacity-60"
                      >
                        Chốt
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {preview && (
        <div className="rounded-lg border border-black/10 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">
              Top 10 — {preview.monthKey}{' '}
              <span className="text-sm font-normal opacity-60">
                ({preview.frozen ? 'đã đóng băng' : 'đang tính sống'} · {preview.total} người ·
                thưởng Top {preview.rewardTiers})
              </span>
            </h3>
            <button onClick={() => setPreview(null)} className="text-sm opacity-60 hover:underline">
              Đóng
            </button>
          </div>
          {preview.pendingFlagged > 0 && (
            <p className="mb-2 text-sm text-yellow-700">
              ⚠ Còn {preview.pendingFlagged} điểm nghi ngờ chưa duyệt.
            </p>
          )}
          <ol className="space-y-1 text-sm">
            {preview.rows.map((e) => (
              <li
                key={e.userId}
                className={`flex justify-between rounded px-2 py-1 ${
                  e.rank <= preview.rewardTiers ? 'bg-snake/10 font-medium' : ''
                }`}
              >
                <span>
                  #{e.rank} {e.nickname}
                </span>
                <span className="tabular-nums">{e.best}</span>
              </li>
            ))}
            {preview.rows.length === 0 && <li className="opacity-60">Chưa có dữ liệu.</li>}
          </ol>
        </div>
      )}

      {closeTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setCloseTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Chốt mùa giải {closeTarget.monthKey}</h3>
            <p className="mt-1 text-sm opacity-70">
              Chốt sẽ đóng băng bảng xếp hạng (không đổi về sau) và gửi thông báo cho Top.
            </p>

            <label className="mt-3 block">
              <span className="mb-1 block text-sm opacity-70">
                Số bậc được thưởng (Top mấy)?<span className="text-red-600"> *</span>
              </span>
              <input
                type="number"
                min={1}
                value={tiersInput}
                onChange={(e) => setTiersInput(e.target.value)}
                className="w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-snake"
                autoFocus
              />
            </label>

            {closeTarget.pendingFlagged > 0 && (
              <div className="mt-3 rounded bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                ⚠ Còn <b>{closeTarget.pendingFlagged}</b> điểm nghi ngờ chưa duyệt trong tháng này.
                Nên duyệt hết trước khi chốt.
              </div>
            )}
            {closeTarget.pendingFlagged === 0 && closeTarget.isCurrent && (
              <div className="mt-3 rounded bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
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
              <button
                onClick={() => setCloseTarget(null)}
                className="rounded bg-black/5 px-4 py-2 text-sm hover:bg-black/10"
              >
                Hủy
              </button>
              <button
                onClick={confirmClose}
                disabled={
                  (closeTarget.pendingFlagged > 0 || closeTarget.isCurrent) && !forceChecked
                }
                className="rounded bg-snake px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Chốt mùa giải
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
