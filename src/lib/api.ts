// Địa chỉ server API (backend tách riêng). Cấu hình qua NEXT_PUBLIC_API_URL.
// Chuẩn hoá: bỏ '/' thừa cuối và tự thêm https:// nếu quên scheme — tránh fetch
// treo/parse lỗi lúc build khi biến bị nhập thiếu "https://".
function normalizeApiUrl(raw: string | undefined): string {
  const v = (raw ?? 'http://localhost:4000').trim().replace(/\/+$/, '');
  if (!v) return 'http://localhost:4000';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

export function apiUrl(path: string): string {
  return `${API_URL}${path.startsWith('/') ? path : '/' + path}`;
}

// Fetch phía client, luôn kèm cookie (credentials) để auth/guest hoạt động cross-origin.
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    credentials: 'include',
    ...init,
  });
}

export const PERIODS = ['day', 'week', 'month', 'all'] as const;
export type Period = (typeof PERIODS)[number];

export interface LeaderboardRow {
  rank: number;
  userId: string;
  nickname: string;
  best: number;
}
