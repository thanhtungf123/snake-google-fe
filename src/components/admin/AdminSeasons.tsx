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

  async function close(s: SeasonRow) {
    const tiersStr = window.prompt(
      `Chốt mùa giải ${s.monthKey}.\nSố bậc được thưởng (Top mấy)?`,
      String(defaultTiers)
    );
    if (tiersStr === null) return;
    const rewardTiers = Number(tiersStr);
    if (!Number.isFinite(rewardTiers) || rewardTiers < 1) {
      setErr('Số bậc thưởng không hợp lệ');
      return;
    }

    let force = false;
    if (s.pendingFlagged > 0) {
      force = window.confirm(
        `Còn ${s.pendingFlagged} điểm NGHI NGỜ chưa duyệt trong tháng ${s.monthKey}.\n` +
          `Nên duyệt hết trước khi chốt.\n\nOK = vẫn chốt (force), Cancel = huỷ.`
      );
      if (!force) return;
    } else if (s.isCurrent) {
      force = window.confirm(
        `Tháng ${s.monthKey} là THÁNG HIỆN TẠI, chưa kết thúc.\nOK = vẫn chốt sớm (force), Cancel = huỷ.`
      );
      if (!force) return;
    } else {
      if (!window.confirm(`Xác nhận CHỐT & đóng băng mùa giải ${s.monthKey}?`)) return;
    }

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
                        onClick={() => close(s)}
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
    </div>
  );
}
