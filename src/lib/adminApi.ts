import { apiFetch } from './api';

async function parseError(r: Response): Promise<string> {
  try {
    const d = await r.json();
    return d.error || `Lỗi ${r.status}`;
  } catch {
    return `Lỗi ${r.status}`;
  }
}

export async function adminGet<T>(path: string): Promise<T> {
  const r = await apiFetch(path);
  if (!r.ok) throw new Error(await parseError(r));
  return r.json() as Promise<T>;
}

export async function adminSend<T>(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown
): Promise<T> {
  const r = await apiFetch(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json() as Promise<T>;
}
