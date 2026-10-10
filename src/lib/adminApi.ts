import { apiFetch } from './api';

// Nhãn tiếng Việt cho từng trường — để báo lỗi validate cụ thể thay vì "Dữ liệu không hợp lệ".
const FIELD_LABELS: Record<string, string> = {
  key: 'Key',
  locale: 'Ngôn ngữ',
  locales: 'Ngôn ngữ',
  slug: 'Slug',
  title: 'Tiêu đề',
  seoTitle: 'SEO Title',
  metaDescription: 'Meta Description',
  h1: 'H1',
  heroH1: 'Tiêu đề lớn trang chủ',
  heroIntro: 'Mô tả dưới tiêu đề',
  bodyHtml: 'Nội dung',
  canonicalOverride: 'Canonical',
  ogTitle: 'OG Title',
  ogDescription: 'OG Description',
  ogImage: 'OG Image',
};

interface ZodFlatten {
  formErrors?: string[];
  fieldErrors?: Record<string, string[]>;
}

// Ghép chi tiết lỗi zod (details.fieldErrors/formErrors) thành thông báo rõ ràng theo từng trường.
function formatDetails(details: ZodFlatten): string | null {
  const parts: string[] = [];
  for (const [field, msgs] of Object.entries(details.fieldErrors ?? {})) {
    if (!msgs?.length) continue;
    const label = FIELD_LABELS[field] ?? field;
    parts.push(`${label}: ${msgs.join(', ')}`);
  }
  for (const m of details.formErrors ?? []) {
    if (m) parts.push(m);
  }
  return parts.length ? parts.join('\n') : null;
}

async function parseError(r: Response): Promise<string> {
  try {
    const d = await r.json();
    const detailMsg = d.details ? formatDetails(d.details) : null;
    if (detailMsg) return detailMsg;
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
