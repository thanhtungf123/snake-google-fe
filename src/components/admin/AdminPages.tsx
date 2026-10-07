'use client';

import { useEffect, useState } from 'react';
import { adminGet, adminSend } from '@/lib/adminApi';
import RichTextEditor from './RichTextEditor';

interface Row {
  id: string;
  key: string;
  locale: 'en' | 'vi';
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  bodyHtml: string;
  robots: { index: boolean; follow: boolean };
  isPublished: boolean;
  updatedAt: string | null;
}

const LOCALES = ['en', 'vi'] as const;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

type Form = {
  key: string;
  locale: 'en' | 'vi';
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  bodyHtml: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  isPublished: boolean;
};

const EMPTY: Form = {
  key: '',
  locale: 'en',
  slug: '',
  title: '',
  metaDescription: '',
  h1: '',
  bodyHtml: '',
  robotsIndex: true,
  robotsFollow: true,
  isPublished: false,
};

export default function AdminPages() {
  const [rows, setRows] = useState<Row[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null); // null = tạo mới
  const [form, setForm] = useState<Form>(EMPTY);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadAll() {
    const d = await adminGet<{ rows: Row[] }>('/api/admin/pages');
    setRows(d.rows);
  }

  useEffect(() => {
    loadAll().catch((e) => setErr(e.message));
  }, []);

  function startNew() {
    setEditingId(null);
    setForm(EMPTY);
    setMsg(null);
    setErr(null);
  }

  function startEdit(r: Row) {
    setEditingId(r.id);
    setForm({
      key: r.key,
      locale: r.locale,
      slug: r.slug,
      title: r.title,
      metaDescription: r.metaDescription ?? '',
      h1: r.h1,
      bodyHtml: r.bodyHtml ?? '',
      robotsIndex: r.robots?.index ?? true,
      robotsFollow: r.robots?.follow ?? true,
      isPublished: r.isPublished,
    });
    setMsg(null);
    setErr(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const common = {
        slug: form.slug,
        title: form.title,
        metaDescription: form.metaDescription,
        h1: form.h1,
        bodyHtml: form.bodyHtml,
        robots: { index: form.robotsIndex, follow: form.robotsFollow },
        isPublished: form.isPublished,
      };
      if (editingId) {
        await adminSend(`/api/admin/pages/${editingId}`, 'PUT', common);
        setMsg('Đã cập nhật trang.');
      } else {
        const res = await adminSend<{ id: string }>('/api/admin/pages', 'POST', {
          ...common,
          key: form.key,
          locale: form.locale,
        });
        setEditingId(res.id);
        setMsg('Đã tạo trang mới.');
      }
      await loadAll();
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(r: Row) {
    if (!confirm(`Xoá trang "${r.title}" (${r.locale}/${r.slug})? Không thể hoàn tác.`)) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await adminSend(`/api/admin/pages/${r.id}`, 'DELETE');
      if (editingId === r.id) startNew();
      await loadAll();
      setMsg('Đã xoá trang.');
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const field = 'w-full rounded border border-black/15 px-3 py-2 text-sm';
  const prefix = form.locale === 'en' ? '' : '/vi';
  const publicUrl = form.slug ? `${SITE_URL}${prefix}/p/${form.slug}/` : '—';

  return (
    <div className="space-y-6">
      {/* Danh sách trang */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Trang tùy chỉnh ({rows.length})</h2>
          <button
            onClick={startNew}
            className="rounded bg-snake px-4 py-1.5 text-sm font-semibold text-white"
          >
            + Tạo trang mới
          </button>
        </div>
        {rows.length === 0 ? (
          <p className="opacity-60">Chưa có trang nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left opacity-60">
                  <th className="py-2 pr-3">Key</th>
                  <th className="py-2 pr-3">Lang</th>
                  <th className="py-2 pr-3">Slug</th>
                  <th className="py-2 pr-3">Tiêu đề</th>
                  <th className="py-2 pr-3">Trạng thái</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-black/5">
                    <td className="py-2 pr-3 font-mono text-xs">{r.key}</td>
                    <td className="py-2 pr-3 uppercase">{r.locale}</td>
                    <td className="py-2 pr-3 font-mono text-xs">/p/{r.slug}</td>
                    <td className="py-2 pr-3">{r.title}</td>
                    <td className="py-2 pr-3">
                      {r.isPublished ? (
                        <span className="text-green-700">Published</span>
                      ) : (
                        <span className="opacity-50">Nháp</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <button onClick={() => startEdit(r)} className="mr-3 text-snake underline">
                        Sửa
                      </button>
                      <button onClick={() => remove(r)} className="text-red-600 underline">
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {err && <p className="text-red-600">{err}</p>}
      {msg && <p className="text-green-700">{msg}</p>}

      {/* Form tạo/sửa */}
      <form onSubmit={save} className="space-y-4 border-t border-black/10 pt-5">
        <h3 className="text-base font-semibold">
          {editingId ? 'Sửa trang' : 'Tạo trang mới'}
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Labeled label="Key (nhóm các bản dịch EN/VI, vd: promo-2026)">
            <input
              className={`${field} font-mono disabled:opacity-60`}
              value={form.key}
              onChange={(e) => set('key', e.target.value)}
              disabled={!!editingId}
              placeholder="promo-2026"
            />
          </Labeled>
          <Labeled label="Ngôn ngữ">
            <select
              className={`${field} disabled:opacity-60`}
              value={form.locale}
              onChange={(e) => set('locale', e.target.value as 'en' | 'vi')}
              disabled={!!editingId}
            >
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </Labeled>
        </div>

        <Labeled label="Slug (chữ thường, số, gạch ngang)">
          <input
            className={`${field} font-mono`}
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="gioi-thieu-su-kien"
          />
        </Labeled>
        <p className="-mt-2 text-xs opacity-60">URL công khai: {publicUrl}</p>

        <Labeled label="Tiêu đề (thẻ title / SEO)">
          <input className={field} value={form.title} onChange={(e) => set('title', e.target.value)} />
        </Labeled>
        <Labeled label="Meta Description">
          <textarea
            className={field}
            rows={2}
            value={form.metaDescription}
            onChange={(e) => set('metaDescription', e.target.value)}
          />
        </Labeled>
        <Labeled label="H1 (tiêu đề hiển thị)">
          <input className={field} value={form.h1} onChange={(e) => set('h1', e.target.value)} />
        </Labeled>
        <div className="text-sm">
          <span className="mb-1 block opacity-60">
            Nội dung (dùng thanh công cụ để tạo tiêu đề, in đậm/nghiêng, danh sách…)
          </span>
          <RichTextEditor
            value={form.bodyHtml}
            resetKey={editingId ?? 'new'}
            onChange={(html) => set('bodyHtml', html)}
            placeholder="Nhập nội dung tại đây…"
          />
        </div>

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
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => set('isPublished', e.target.checked)}
            />
            Hiển thị công khai (publish)
          </label>
        </div>

        <div className="flex gap-3">
          <button
            disabled={busy}
            className="rounded bg-snake px-5 py-2 font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Đang lưu…' : editingId ? 'Lưu thay đổi' : 'Tạo trang'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={startNew}
              className="rounded border border-black/15 px-5 py-2 text-sm"
            >
              Huỷ / tạo mới
            </button>
          )}
        </div>
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
