// Điểm "chờ lưu" của khách: khi chơi xong lúc chưa đăng nhập, lưu tạm vào localStorage
// để sau khi đăng nhập/đăng ký có thể hiện popup "đã lưu điểm thành công".
// (Backend đã tự gắn điểm guest vào tài khoản khi đăng ký/đăng nhập — đây chỉ để thông báo.)
'use client';

export const PENDING_KEY = 'gs:pendingScore';
export const TOAST_KEY = 'gs:scoreSavedToast';
export const TOAST_EVENT = 'gs:score-saved-toast';
const PENDING_TTL_MS = 30 * 60 * 1000; // 30 phút

export interface PendingScore {
  score: number;
  status: string;
  ts: number;
}

export function readPending(): PendingScore | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PendingScore;
    if (!p || typeof p.score !== 'number') return null;
    if (Date.now() - (p.ts || 0) > PENDING_TTL_MS) {
      localStorage.removeItem(PENDING_KEY);
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function writePending(score: number, status: string): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ score, status, ts: Date.now() }));
  } catch {
    /* ignore */
  }
}

export function clearPending(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

// Gọi sau khi đăng nhập/đăng ký thành công: nếu có điểm chờ thì xếp hàng toast "đã lưu".
export function queueSavedToastFromPending(): void {
  const p = readPending();
  if (!p) return;
  try {
    localStorage.setItem(TOAST_KEY, JSON.stringify({ score: p.score, status: p.status }));
  } catch {
    /* ignore */
  }
  clearPending();
  try {
    window.dispatchEvent(new Event(TOAST_EVENT));
  } catch {
    /* ignore */
  }
}
