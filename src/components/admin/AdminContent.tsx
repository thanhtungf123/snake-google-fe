'use client';

import { useEffect, useState } from 'react';
import { adminGet, adminSend } from '@/lib/adminApi';
import RichTextEditor from './RichTextEditor';

interface Row {
  pageKey: string;
  locale: string;
  slug: string;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  heroH1: string;
  heroIntro: string;
  bodyHtml: string;
  canonicalOverride: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  robots: { index: boolean; follow: boolean };
  isPublished: boolean;
}

type PageKey = 'home' | 'rewards';
const PAGE_KEYS: PageKey[] = ['home', 'rewards'];
const PAGE_LABEL: Record<PageKey, string> = {
  home: 'Trang chủ (khối SEO)',
  rewards: 'Phần thưởng',
};
const LOCALES = ['en', 'vi'] as const;
const DEFAULT_SLUG: Record<PageKey, { en: string; vi: string }> = {
  home: { en: '/', vi: '/' },
  rewards: { en: '/rewards', vi: '/phan-thuong' },
};

type Form = {
  slug: string;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  heroH1: string;
  heroIntro: string;
  bodyHtml: string;
  canonicalOverride: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  isPublished: boolean;
};

const EMPTY: Form = {
  slug: '',
  seoTitle: '',
  metaDescription: '',
  h1: '',
  heroH1: '',
  heroIntro: '',
  bodyHtml: '',
  canonicalOverride: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  robotsIndex: true,
  robotsFollow: true,
  isPublished: true,
};

export default function AdminContent() {
  const [rows, setRows] = useState<Row[]>([]);
  const [pageKey, setPageKey] = useState<PageKey>('home');
  const [locale, setLocale] = useState<(typeof LOCALES)[number]>('en');
  const [form, setForm] = useState<Form>(EMPTY);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadAll() {
    const d = await adminGet<{ rows: Row[] }>('/api/admin/content');
    setRows(d.rows);
    return d.rows;
  }

  useEffect(() => {
    loadAll().catch((e) => setErr(e.message));
  }, []);

  // Khi đổi page/locale, nạp form từ dữ liệu đã có (hoặc rỗng + slug mặc định).
  useEffect(() => {
    const existing = rows.find((r) => r.pageKey === pageKey && r.locale === locale);
    if (existing) {
      setForm({
        slug: existing.slug,
        seoTitle: existing.seoTitle,
        metaDescription: existing.metaDescription,
        h1: existing.h1,
        heroH1: existing.heroH1 ?? '',
        heroIntro: existing.heroIntro ?? '',
        bodyHtml: existing.bodyHtml,
        canonicalOverride: existing.canonicalOverride ?? '',
        ogTitle: existing.ogTitle ?? '',
        ogDescription: existing.ogDescription ?? '',
        ogImage: existing.ogImage ?? '',
        robotsIndex: existing.robots?.index ?? true,
        robotsFollow: existing.robots?.follow ?? true,
        isPublished: existing.isPublished,
      });
    } else {
      setForm({ ...EMPTY, slug: DEFAULT_SLUG[pageKey][locale] });
    }
    setMsg(null);
    setErr(null);
  }, [pageKey, locale, rows]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const payload = {
        slug: form.slug,
        seoTitle: form.seoTitle,
        metaDescription: form.metaDescription,
        h1: form.h1,
        heroH1: form.heroH1,
        heroIntro: form.heroIntro,
        bodyHtml: form.bodyHtml,
        canonicalOverride: form.canonicalOverride || undefined,
        ogTitle: form.ogTitle || undefined,
        ogDescription: form.ogDescription || undefined,
        ogImage: form.ogImage || undefined,
        robots: { index: form.robotsIndex, follow: form.robotsFollow },
        isPublished: form.isPublished,
      };
      await adminSend(`/api/admin/content/${pageKey}/${locale}`, 'PUT', payload);
      await loadAll();
      setMsg('Đã lưu. Trang công khai sẽ dùng nội dung này (fallback về text mặc định nếu để trống & chưa publish).');
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const field = 'w-full rounded border border-black/15 px-3 py-2 text-sm';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="mb-1 block opacity-60">Trang</span>
          <select
            value={pageKey}
            onChange={(e) => setPageKey(e.target.value as PageKey)}
            className="rounded border border-black/15 px-3 py-2"
          >
            {PAGE_KEYS.map((k) => (
              <option key={k} value={k}>
                {PAGE_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block opacity-60">Ngôn ngữ</span>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as (typeof LOCALES)[number])}
            className="rounded border border-black/15 px-3 py-2"
          >
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>

      {err && <p className="whitespace-pre-line text-red-600">{err}</p>}
      {msg && <p className="text-green-700">{msg}</p>}

      <form onSubmit={save} className="space-y-4">
        <Labeled label="Slug (chỉ để tham khảo/SEO)">
          <input className={field} value={form.slug} onChange={(e) => set('slug', e.target.value)} />
        </Labeled>
        <Labeled label="SEO Title (thẻ title)">
          <input className={field} value={form.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} />
        </Labeled>
        <Labeled label="Meta Description">
          <textarea
            className={field}
            rows={2}
            value={form.metaDescription}
            onChange={(e) => set('metaDescription', e.target.value)}
          />
        </Labeled>
        {pageKey === 'home' && (
          <>
            <Labeled label="Tiêu đề lớn trang chủ (H1 — để trống = mặc định)">
              <input
                className={field}
                value={form.heroH1}
                onChange={(e) => set('heroH1', e.target.value)}
                placeholder="VD: Chơi Rắn Săn Mồi Online"
              />
            </Labeled>
            <Labeled label="Mô tả dưới tiêu đề (để trống = mặc định)">
              <textarea
                className={field}
                rows={2}
                value={form.heroIntro}
                onChange={(e) => set('heroIntro', e.target.value)}
                placeholder="VD: Game rắn săn mồi cổ điển, chơi ngay trên trình duyệt…"
              />
            </Labeled>
          </>
        )}
        <Labeled label={pageKey === 'home' ? 'Tiêu đề khối SEO phía dưới (H2)' : 'H1'}>
          <input className={field} value={form.h1} onChange={(e) => set('h1', e.target.value)} />
        </Labeled>
        <div className="text-sm">
          <span className="mb-1 block opacity-60">
            Nội dung (dùng thanh công cụ để tạo tiêu đề, in đậm/nghiêng, danh sách… — để trống sẽ
            dùng text mặc định từ i18n)
          </span>
          <RichTextEditor
            value={form.bodyHtml}
            resetKey={`${pageKey}-${locale}`}
            onChange={(html) => set('bodyHtml', html)}
            placeholder="Nhập nội dung tại đây…"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Labeled label="OG Title (để trống = dùng SEO Title)">
            <input className={field} value={form.ogTitle} onChange={(e) => set('ogTitle', e.target.value)} />
          </Labeled>
          <Labeled label="OG Image (URL)">
            <input className={field} value={form.ogImage} onChange={(e) => set('ogImage', e.target.value)} />
          </Labeled>
        </div>
        <Labeled label="OG Description (để trống = dùng Meta Description)">
          <textarea
            className={field}
            rows={2}
            value={form.ogDescription}
            onChange={(e) => set('ogDescription', e.target.value)}
          />
        </Labeled>
        <Labeled label="Canonical override (để trống = tự động theo URL trang)">
          <input
            className={field}
            value={form.canonicalOverride}
            onChange={(e) => set('canonicalOverride', e.target.value)}
            placeholder="https://googlesnakemods.com/..."
          />
        </Labeled>

        <div className="flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.robotsIndex}
              onChange={(e) => set('robotsIndex', e.target.checked)}
            />
            Robots: index
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.robotsFollow}
              onChange={(e) => set('robotsFollow', e.target.checked)}
            />
            Robots: follow
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => set('isPublished', e.target.checked)}
          />
          Hiển thị công khai (publish)
        </label>

        <button
          disabled={busy}
          className="rounded bg-snake px-5 py-2 font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Đang lưu…' : 'Lưu'}
        </button>
      </form>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block opacity-60">{label}</span>
      {children}
    </label>
  );
}
