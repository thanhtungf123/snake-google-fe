// Địa chỉ server API (backend tách riêng). Cấu hình qua NEXT_PUBLIC_API_URL.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
