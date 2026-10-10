'use client';

import { useEffect, useState } from 'react';
import { adminGet, adminSend } from '@/lib/adminApi';
import RichTextEditor from './RichTextEditor';
import ConfirmModal from './ConfirmModal';

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

type Form = {
  key: string;
  // Lựa chọn ngôn ngữ khi TẠO MỚI (ô tick). Khi sửa, dùng `editLocale` thay cho 2 cờ này.
  localeEn: boolean;
  localeVi: boolean;
  editLocale: 'en' | 'vi';
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
  localeEn: true,
  localeVi: false,
  editLocale: 'en',
  slug: '',
  title: '',
  metaDescription: '',
  h1: '',
  bodyHtml: '',
  robotsIndex: true,
  robotsFollow: true,
  isPublished: false,
};

function urlFor(locale: 'en' | 'vi', slug: string): string {
  const prefix = locale === 'en' ? '' : '/vi';
  return slug ? `${SITE_URL}${prefix}/${slug}/` : '—';
}

export default function AdminPages() {
  const [rows, setRows] = useState<Row[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null); // null = tạo mới
  const [form, setForm] = useState<Form>(EMPTY);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

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
      localeEn: r.locale === 'en',
      localeVi: r.locale === 'vi',
      editLocale: r.locale,
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
    setErr(null);
    setMsg(null);

    const common = {
      slug: form.slug,
      title: form.title,
      metaDescription: form.metaDescription,
      h1: form.h1,
      bodyHtml: form.bodyHtml,
      robots: { index: form.robotsIndex, follow: form.robotsFollow },
      isPublished: form.isPublished,
    };

    if (!editingId) {
      const locales = [
        ...(form.localeEn ? ['en'] : []),
        ...(form.localeVi ? ['vi'] : []),
      ] as ('en' | 'vi')[];
      if (locales.length === 0) {
        setErr('Chọn ít nhất một ngôn ngữ (EN hoặc VI).');
        return;
      }
    }

    setBusy(true);
    try {
      if (editingId) {
        await adminSend(`/api/admin/pages/${editingId}`, 'PUT', common);
        setMsg('Đã cập nhật trang.');
      } else {
        const locales = [
          ...(form.localeEn ? ['en'] : []),
          ...(form.localeVi ? ['vi'] : []),
        ] as ('en' | 'vi')[];
        const res = await adminSend<{ id: string }>('/api/admin/pages', 'POST', {
          ...common,
          key: form.key,
          locales,
        });
        setEditingId(res.id);
        setMsg(
          form.localeEn && form.localeVi
            ? 'Đã tạo trang EN. Bản VI được tạo dạng nháp với nội dung TRỐNG — mở ra nhập tiếng Việt rồi publish.'
            : 'Đã tạo trang mới.'
        );
      }
      await loadAll();
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function doRemove(r: Row) {
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
      setConfirmDelete(null);
    }
  }

  // Trong lúc sửa: tạo nhanh bản dịch còn thiếu (EN↔VI) cho cùng key — bản mới là nháp, nội dung trống.
  async function addMissingLocale(other: 'en' | 'vi') {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await adminSend<{ id: string }>('/api/admin/pages', 'POST', {
        key: form.key,
        locales: [other],
        slug: form.slug,
        title: form.title,
        metaDescription: '',
        h1: form.h1,
        bodyHtml: '',
        robots: { index: form.robotsIndex, follow: form.robotsFollow },
        isPublished: false,
      });
      const fresh = await adminGet<{ rows: Row[] }>('/api/admin/pages');
      setRows(fresh.rows);
      const created = fresh.rows.find((r) => r.id === res.id);
      if (created) startEdit(created);
      setMsg(
        `Đã tạo bản ${other.toUpperCase()} (nháp, nội dung trống). Nhập nội dung tiếng ${
          other === 'vi' ? 'Việt' : 'Anh'
        } rồi publish.`
      );
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const field = 'w-full rounded border border-black/15 px-3 py-2 text-sm';

  // Ngôn ngữ còn thiếu của trang đang sửa (để nút "tạo bản dịch còn thiếu").
  const otherLocale: 'en' | 'vi' = form.editLocale === 'en' ? 'vi' : 'en';
  const otherExists = editingId
    ? rows.some((r) => r.key === form.key && r.locale === otherLocale)
    : false;

  // Ngôn ngữ viết nội dung: EN nếu có chọn EN, ngược lại VI (khi tạo mới); khi sửa là ngôn ngữ của bản ghi.
  const contentLang = editingId
    ? form.editLocale
    : form.localeEn
      ? 'en'
      : form.localeVi
        ? 'vi'
        : null;
  const contentLangLabel =
    contentLang === 'en' ? 'Tiếng Anh' : contentLang === 'vi' ? 'Tiếng Việt' : '—';

  // Gộp các bản dịch cùng `key` thành 1 dòng (EN trước VI) để list gọn hơn.
  const groups = Array.from(
    rows.reduce((m, r) => {
      const list = m.get(r.key) ?? [];
      list.push(r);
      m.set(r.key, list);
      return m;
    }, new Map<string, Row[]>())
  ).map(([key, list]) => ({
    key,
    list: [...list].sort((a, b) => a.locale.localeCompare(b.locale)),
  }));

  return (
    <div className="space-y-6">
      {/* Danh sách trang */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Trang tùy chỉnh ({groups.length})</h2>
          <button
            onClick={startNew}
            className="rounded bg-snake px-4 py-1.5 text-sm font-semibold text-white"
          >
            + Tạo trang mới
          </button>
        </div>
        {groups.length === 0 ? (
          <p className="opacity-60">Chưa có trang nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left opacity-60">
                  <th className="py-2 pr-3">Key</th>
                  <th className="py-2 pr-3">Tiêu đề</th>
                  <th className="py-2 pr-3">Bản dịch</th>
                  <th className="py-2 pr-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => {
                  const primary = g.list.find((r) => r.locale === 'en') ?? g.list[0];
                  return (
                    <tr key={g.key} className="border-b border-black/5 align-top">
                      <td className="py-2 pr-3 font-mono text-xs">{g.key}</td>
                      <td className="py-2 pr-3">{primary.title}</td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-col gap-1">
                          {g.list.map((r) => (
                            <div key={r.id} className="flex items-center gap-2">
                              <span className="rounded bg-black/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase">
                                {r.locale}
                              </span>
                              <span className="font-mono text-xs opacity-70">
                                {r.locale === 'en' ? '' : '/vi'}/{r.slug}
                              </span>
                              {r.isPublished ? (
                                <span className="text-xs text-green-700">Published</span>
                              ) : (
                                <span className="text-xs opacity-50">Nháp</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-col gap-1">
                          {g.list.map((r) => (
                            <div key={r.id} className="flex items-center gap-3 text-xs">
                              <span className="w-5 uppercase opacity-50">{r.locale}</span>
                              {r.isPublished && (
                                <a
                                  href={urlFor(r.locale, r.slug)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-snake underline"
                                >
                                  Xem
                                </a>
                              )}
                              <button onClick={() => startEdit(r)} className="text-snake underline">
                                Sửa
                              </button>
                              <button
                                onClick={() => setConfirmDelete(r)}
                                className="text-red-600 underline"
                              >
                                Xoá
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {err && <p className="whitespace-pre-line text-red-600">{err}</p>}
      {msg && <p className="text-green-700">{msg}</p>}

      {/* Form tạo/sửa */}
      <form onSubmit={save} className="space-y-4 border-t border-black/10 pt-5">
        <h3 className="text-base font-semibold">{editingId ? 'Sửa trang' : 'Tạo trang mới'}</h3>

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

          {editingId ? (
            <div className="text-sm">
              <span className="mb-1 block opacity-60">Ngôn ngữ</span>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="rounded bg-black/10 px-2 py-1 text-xs font-semibold uppercase">
                  {form.editLocale}
                </span>
                {otherExists ? (
                  <span className="text-xs opacity-60">Đã có bản {otherLocale.toUpperCase()}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => addMissingLocale(otherLocale)}
                    disabled={busy}
                    className="rounded border border-snake px-3 py-1 text-xs font-medium text-snake hover:bg-snake hover:text-white disabled:opacity-50"
                  >
                    + Tạo bản {otherLocale.toUpperCase()} còn thiếu
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm">
              <span className="mb-1 block opacity-60">Ngôn ngữ (chọn một hoặc cả hai)</span>
              <div className="flex gap-5 pt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.localeEn}
                    onChange={(e) => set('localeEn', e.target.checked)}
                  />
                  EN (Tiếng Anh)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.localeVi}
                    onChange={(e) => set('localeVi', e.target.checked)}
                  />
                  VI (Tiếng Việt)
                </label>
              </div>
            </div>
          )}
        </div>

        {!editingId && (
          <p className="-mt-2 rounded bg-black/[0.03] px-3 py-2 text-xs opacity-70">
            {form.localeEn && form.localeVi
              ? 'Đã chọn cả hai: nhập nội dung bằng Tiếng Anh. Hệ thống tạo thêm bản VI dạng nháp (copy nội dung EN) để bạn tự dịch rồi publish.'
              : `Nhập nội dung bằng ${contentLangLabel}. Trang chỉ có 1 ngôn ngữ nên nút chuyển EN/VI sẽ ẩn khi người xem mở trang.`}
          </p>
        )}

        <Labeled label="Slug (chữ thường, số, gạch ngang — không chứa /p/)">
          <input
            className={`${field} font-mono`}
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="gioi-thieu-su-kien"
          />
        </Labeled>
        <div className="-mt-2 space-y-0.5 text-xs opacity-60">
          {editingId ? (
            <p>URL công khai: {urlFor(form.editLocale, form.slug)}</p>
          ) : (
            <>
              {form.localeEn && <p>URL (EN): {urlFor('en', form.slug)}</p>}
              {form.localeVi && <p>URL (VI): {urlFor('vi', form.slug)}</p>}
            </>
          )}
        </div>

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
            Nội dung ({contentLangLabel}) — dùng thanh công cụ để tạo tiêu đề, in đậm/nghiêng, danh sách…
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

      <ConfirmModal
        open={!!confirmDelete}
        title="Xoá trang"
        message={
          confirmDelete
            ? `Xoá "${confirmDelete.title}" (${confirmDelete.locale}/${confirmDelete.slug})? Không thể hoàn tác.`
            : ''
        }
        confirmText="Xoá"
        danger
        onConfirm={() => confirmDelete && doRemove(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
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
