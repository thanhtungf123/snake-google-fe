'use client';

import { useEffect, useState } from 'react';
import { adminGet, adminSend } from '@/lib/adminApi';
import RichTextEditor from './RichTextEditor';
import ConfirmModal from './ConfirmModal';
import ImageUploadField from './ImageUploadField';

interface Row {
  id: string;
  key: string;
  locale: 'en' | 'vi';
  slug: string;
  order: number;
  title: string;
  metaDescription: string;
  h1: string;
  thumbnailUrl: string;
  cardDescription: string;
  embedUrl: string;
  aspectW: number;
  aspectH: number;
  bodyHtml: string;
  relatedKeys: string[];
  robots: { index: boolean; follow: boolean };
  isPublished: boolean;
  updatedAt: string | null;
}

interface IndexConf {
  title: string;
  metaDescription: string;
  h1: string;
  introHtml: string;
  robots: { index: boolean; follow: boolean };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

type Form = {
  key: string;
  localeEn: boolean;
  localeVi: boolean;
  editLocale: 'en' | 'vi';
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  thumbnailUrl: string;
  cardDescription: string;
  embedUrl: string;
  aspectW: number;
  aspectH: number;
  bodyHtml: string;
  relatedKeys: string[];
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
  thumbnailUrl: '',
  cardDescription: '',
  embedUrl: '',
  aspectW: 16,
  aspectH: 9,
  bodyHtml: '',
  relatedKeys: [],
  robotsIndex: true,
  robotsFollow: true,
  isPublished: false,
};

function gameUrl(locale: 'en' | 'vi', slug: string): string {
  const prefix = locale === 'en' ? '' : '/vi';
  return slug ? `${SITE_URL}${prefix}/games/${slug}/` : '—';
}

function indexUrl(locale: 'en' | 'vi'): string {
  return locale === 'en' ? `${SITE_URL}/all-games/` : `${SITE_URL}/vi/tro-choi/`;
}

export default function AdminGames() {
  const [rows, setRows] = useState<Row[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

  async function loadAll() {
    const d = await adminGet<{ rows: Row[] }>('/api/admin/games');
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
      thumbnailUrl: r.thumbnailUrl ?? '',
      cardDescription: r.cardDescription ?? '',
      embedUrl: r.embedUrl ?? '',
      aspectW: r.aspectW ?? 16,
      aspectH: r.aspectH ?? 9,
      bodyHtml: r.bodyHtml ?? '',
      relatedKeys: r.relatedKeys ?? [],
      robotsIndex: r.robots?.index ?? true,
      robotsFollow: r.robots?.follow ?? true,
      isPublished: r.isPublished,
    });
    setMsg(null);
    setErr(null);
    if (typeof window !== 'undefined') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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
      thumbnailUrl: form.thumbnailUrl,
      cardDescription: form.cardDescription,
      embedUrl: form.embedUrl,
      aspectW: Number(form.aspectW) || 16,
      aspectH: Number(form.aspectH) || 9,
      bodyHtml: form.bodyHtml,
      relatedKeys: form.relatedKeys,
      robots: { index: form.robotsIndex, follow: form.robotsFollow },
      isPublished: form.isPublished,
    };

    if (!editingId) {
      const locales = [...(form.localeEn ? ['en'] : []), ...(form.localeVi ? ['vi'] : [])];
      if (locales.length === 0) {
        setErr('Chọn ít nhất một ngôn ngữ (EN hoặc VI).');
        return;
      }
    }

    setBusy(true);
    try {
      if (editingId) {
        await adminSend(`/api/admin/games/${editingId}`, 'PUT', common);
        setMsg('Đã cập nhật game.');
      } else {
        const locales = [...(form.localeEn ? ['en'] : []), ...(form.localeVi ? ['vi'] : [])] as (
          | 'en'
          | 'vi'
        )[];
        const res = await adminSend<{ id: string }>('/api/admin/games', 'POST', {
          ...common,
          key: form.key,
          locales,
        });
        setEditingId(res.id);
        setMsg(
          form.localeEn && form.localeVi
            ? 'Đã tạo game EN. Bản VI được tạo dạng nháp với phần văn bản TRỐNG — mở ra nhập tiếng Việt rồi publish.'
            : 'Đã tạo game mới.'
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
      await adminSend(`/api/admin/games/${r.id}`, 'DELETE');
      if (editingId === r.id) startNew();
      await loadAll();
      setMsg('Đã xoá game.');
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
      setConfirmDelete(null);
    }
  }

  async function addMissingLocale(other: 'en' | 'vi') {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await adminSend<{ id: string }>('/api/admin/games', 'POST', {
        key: form.key,
        locales: [other],
        slug: form.slug,
        title: form.title,
        metaDescription: '',
        h1: form.h1,
        thumbnailUrl: form.thumbnailUrl,
        cardDescription: '',
        embedUrl: form.embedUrl,
        aspectW: Number(form.aspectW) || 16,
        aspectH: Number(form.aspectH) || 9,
        bodyHtml: '',
        relatedKeys: form.relatedKeys,
        robots: { index: form.robotsIndex, follow: form.robotsFollow },
        isPublished: false,
      });
      const fresh = await adminGet<{ rows: Row[] }>('/api/admin/games');
      setRows(fresh.rows);
      const created = fresh.rows.find((r) => r.id === res.id);
      if (created) startEdit(created);
      setMsg(
        `Đã tạo bản ${other.toUpperCase()} (nháp, phần văn bản trống). Nhập nội dung tiếng ${
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

  const otherLocale: 'en' | 'vi' = form.editLocale === 'en' ? 'vi' : 'en';
  const otherExists = editingId ? rows.some((r) => r.key === form.key && r.locale === otherLocale) : false;

  const contentLang = editingId ? form.editLocale : form.localeEn ? 'en' : form.localeVi ? 'vi' : null;
  const contentLangLabel = contentLang === 'en' ? 'Tiếng Anh' : contentLang === 'vi' ? 'Tiếng Việt' : '—';

  // Danh sách key game (duy nhất) để chọn "game liên quan" — bỏ chính nó.
  const allKeys = Array.from(new Set(rows.map((r) => r.key))).filter((k) => k !== form.key);

  // Gộp các bản dịch cùng `key` thành 1 dòng.
  const groups = Array.from(
    rows.reduce((m, r) => {
      const list = m.get(r.key) ?? [];
      list.push(r);
      m.set(r.key, list);
      return m;
    }, new Map<string, Row[]>())
  )
    .map(([key, list]) => ({
      key,
      order: list[0]?.order ?? 0,
      list: [...list].sort((a, b) => a.locale.localeCompare(b.locale)),
    }))
    .sort((a, b) => a.order - b.order);

  async function moveGroup(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= groups.length) return;
    const keys = groups.map((g) => g.key);
    [keys[index], keys[next]] = [keys[next], keys[index]];
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await adminSend('/api/admin/games/reorder', 'PUT', { keys });
      await loadAll();
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function toggleRelated(k: string) {
    setForm((f) => ({
      ...f,
      relatedKeys: f.relatedKeys.includes(k)
        ? f.relatedKeys.filter((x) => x !== k)
        : [...f.relatedKeys, k],
    }));
  }

  return (
    <div className="space-y-8">
      {/* ======= Cấu hình trang tổng hợp ======= */}
      <GamesIndexEditor />

      {/* ======= Danh sách game ======= */}
      <div className="border-t border-black/10 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Game ({groups.length})</h2>
          <button
            onClick={startNew}
            className="rounded bg-snake px-4 py-1.5 text-sm font-semibold text-white"
          >
            + Thêm game mới
          </button>
        </div>
        {groups.length === 0 ? (
          <p className="opacity-60">Chưa có game nào.</p>
        ) : (
          <>
            <p className="mb-2 text-xs opacity-60">
              Dùng ▲▼ để sắp thứ tự hiển thị trong trang tổng hợp (áp dụng cho cả bản EN và VI cùng key).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left opacity-60">
                    <th className="py-2 pr-3">Thứ tự</th>
                    <th className="py-2 pr-3">Key</th>
                    <th className="py-2 pr-3">Tên</th>
                    <th className="py-2 pr-3">Bản dịch</th>
                    <th className="py-2 pr-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g, gi) => {
                    const primary = g.list.find((r) => r.locale === 'en') ?? g.list[0];
                    return (
                      <tr key={g.key} className="border-b border-black/5 align-top">
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col leading-none">
                              <button
                                type="button"
                                onClick={() => moveGroup(gi, -1)}
                                disabled={busy || gi === 0}
                                className="px-1 text-xs opacity-60 hover:opacity-100 disabled:opacity-20"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => moveGroup(gi, 1)}
                                disabled={busy || gi === groups.length - 1}
                                className="px-1 text-xs opacity-60 hover:opacity-100 disabled:opacity-20"
                              >
                                ▼
                              </button>
                            </div>
                            <span className="text-xs opacity-50">{gi + 1}</span>
                          </div>
                        </td>
                        <td className="py-2 pr-3 font-mono text-xs">{g.key}</td>
                        <td className="py-2 pr-3">{primary.h1 || primary.title}</td>
                        <td className="py-2 pr-3">
                          <div className="flex flex-col gap-1">
                            {g.list.map((r) => (
                              <div key={r.id} className="flex items-center gap-2">
                                <span className="rounded bg-black/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase">
                                  {r.locale}
                                </span>
                                <span className="font-mono text-xs opacity-70">
                                  {r.locale === 'en' ? '' : '/vi'}/games/{r.slug}
                                </span>
                                {r.isPublished ? (
                                  <span className="text-xs text-green-700">Published</span>
                                ) : (
                                  <span className="text-xs opacity-50">Nháp</span>
                                )}
                                {!r.embedUrl && (
                                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-700">
                                    chưa gắn iframe
                                  </span>
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
                                    href={gameUrl(r.locale, r.slug)}
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
          </>
        )}
      </div>

      {err && <p className="whitespace-pre-line text-red-600">{err}</p>}
      {msg && <p className="text-green-700">{msg}</p>}

      {/* ======= Form tạo/sửa game ======= */}
      <form onSubmit={save} className="space-y-4 border-t border-black/10 pt-5">
        <h3 className="text-base font-semibold">{editingId ? 'Sửa game' : 'Thêm game mới'}</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Labeled label="Key (nhóm các bản dịch EN/VI, vd: snake-3d)">
            <input
              className={`${field} font-mono disabled:opacity-60`}
              value={form.key}
              onChange={(e) => set('key', e.target.value)}
              disabled={!!editingId}
              placeholder="snake-3d"
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
                  EN
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.localeVi}
                    onChange={(e) => set('localeVi', e.target.checked)}
                  />
                  VI
                </label>
              </div>
            </div>
          )}
        </div>

        {!editingId && (
          <p className="-mt-2 rounded bg-black/[0.03] px-3 py-2 text-xs opacity-70">
            Nhập nội dung bằng {contentLangLabel}.{' '}
            {form.localeEn && form.localeVi
              ? 'Hệ thống tạo thêm bản VI dạng nháp (phần văn bản trống, dùng chung ảnh/iframe) để bạn tự dịch rồi publish.'
              : ''}
          </p>
        )}

        <Labeled label="Slug (nằm dưới /games/ — chữ thường, số, gạch ngang)">
          <input
            className={`${field} font-mono`}
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="snake-3d"
          />
        </Labeled>
        <div className="-mt-2 text-xs opacity-60">
          {editingId ? (
            <p>URL công khai: {gameUrl(form.editLocale, form.slug)}</p>
          ) : (
            <>
              {form.localeEn && <p>URL (EN): {gameUrl('en', form.slug)}</p>}
              {form.localeVi && <p>URL (VI): {gameUrl('vi', form.slug)}</p>}
            </>
          )}
        </div>

        <Labeled label="Link nhúng GamePix (iframe) — phải là https://…gamepix.com/…">
          <input
            className={`${field} font-mono`}
            value={form.embedUrl}
            onChange={(e) => set('embedUrl', e.target.value)}
            placeholder="https://play.gamepix.com/snake/embed?..."
          />
        </Labeled>
        <div className="-mt-2 text-xs opacity-60">
          Mở game trên my.gamepix.com → nút Share/Embed → dán URL trong thuộc tính <code>src</code> của iframe vào đây.
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUploadField
            label="Ảnh thumbnail (hiện trên thẻ game)"
            value={form.thumbnailUrl}
            onChange={(url) => set('thumbnailUrl', url)}
            folder="games"
            hint="Chọn ảnh từ máy để tải lên, hoặc dán URL. Tỉ lệ đẹp nhất 16:9."
          />
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Tỉ lệ khung (rộng)">
              <input
                type="number"
                min={1}
                max={100}
                className={field}
                value={form.aspectW}
                onChange={(e) => set('aspectW', Number(e.target.value))}
              />
            </Labeled>
            <Labeled label="Tỉ lệ khung (cao)">
              <input
                type="number"
                min={1}
                max={100}
                className={field}
                value={form.aspectH}
                onChange={(e) => set('aspectH', Number(e.target.value))}
              />
            </Labeled>
          </div>
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
        <Labeled label="H1 (tên game hiển thị)">
          <input className={field} value={form.h1} onChange={(e) => set('h1', e.target.value)} />
        </Labeled>
        <Labeled label="Mô tả ngắn trên thẻ game (hiện trong lưới tổng hợp)">
          <textarea
            className={field}
            rows={2}
            value={form.cardDescription}
            onChange={(e) => set('cardDescription', e.target.value)}
          />
        </Labeled>

        <div className="text-sm">
          <span className="mb-1 block opacity-60">
            Nội dung chi tiết ({contentLangLabel}) — hiện dưới game.
          </span>
          <RichTextEditor
            value={form.bodyHtml}
            resetKey={editingId ?? 'new'}
            onChange={(html) => set('bodyHtml', html)}
            placeholder="Mô tả game, cách chơi…"
          />
        </div>

        <div className="text-sm">
          <span className="mb-1 block opacity-60">
            Game liên quan (bỏ trống = tự hiện các game khác). Chọn các game muốn hiện ở cuối trang:
          </span>
          {allKeys.length === 0 ? (
            <p className="text-xs opacity-50">Chưa có game khác để chọn.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allKeys.map((k) => (
                <label
                  key={k}
                  className={`cursor-pointer rounded border px-2 py-1 text-xs ${
                    form.relatedKeys.includes(k)
                      ? 'border-snake bg-snake/10 text-snake'
                      : 'border-black/15'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mr-1 align-middle"
                    checked={form.relatedKeys.includes(k)}
                    onChange={() => toggleRelated(k)}
                  />
                  {k}
                </label>
              ))}
            </div>
          )}
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
            {busy ? 'Đang lưu…' : editingId ? 'Lưu thay đổi' : 'Tạo game'}
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
        title="Xoá game"
        message={
          confirmDelete
            ? `Xoá "${confirmDelete.h1 || confirmDelete.title}" (${confirmDelete.locale}/games/${confirmDelete.slug})? Không thể hoàn tác.`
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

// ======= Trình sửa cấu hình trang tổng hợp (/all-games · /vi/tro-choi) =======
function GamesIndexEditor() {
  const [data, setData] = useState<Record<'en' | 'vi', IndexConf> | null>(null);
  const [tab, setTab] = useState<'en' | 'vi'>('en');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    adminGet<{ index: Record<'en' | 'vi', IndexConf> }>('/api/admin/games-index')
      .then((d) => setData(d.index))
      .catch((e) => setErr(e.message));
  }, []);

  if (!data) return <p className="opacity-60">Đang tải cấu hình trang tổng hợp…</p>;
  const conf = data[tab];
  const field = 'w-full rounded border border-black/15 px-3 py-2 text-sm';

  function upd(patch: Partial<IndexConf>) {
    setData((d) => (d ? { ...d, [tab]: { ...d[tab], ...patch } } : d));
  }

  async function saveIndex() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await adminSend(`/api/admin/games-index/${tab}`, 'PUT', {
        title: conf.title,
        metaDescription: conf.metaDescription,
        h1: conf.h1,
        introHtml: conf.introHtml,
        robots: conf.robots,
      });
      setMsg(`Đã lưu cấu hình trang tổng hợp (${tab.toUpperCase()}).`);
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-black/10 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Trang tổng hợp game</h2>
        <div className="flex gap-1">
          {(['en', 'vi'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setTab(l)}
              className={`rounded px-3 py-1 text-xs font-semibold uppercase ${
                tab === l ? 'bg-snake text-white' : 'bg-black/5'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-3 text-xs opacity-60">URL: {indexUrl(tab)}</p>

      <div className="space-y-3">
        <Labeled label="Tiêu đề (thẻ title / SEO)">
          <input className={field} value={conf.title} onChange={(e) => upd({ title: e.target.value })} />
        </Labeled>
        <Labeled label="Meta Description">
          <textarea
            className={field}
            rows={2}
            value={conf.metaDescription}
            onChange={(e) => upd({ metaDescription: e.target.value })}
          />
        </Labeled>
        <Labeled label="H1 (tiêu đề lớn trên đầu trang)">
          <input className={field} value={conf.h1} onChange={(e) => upd({ h1: e.target.value })} />
        </Labeled>
        <div className="text-sm">
          <span className="mb-1 block opacity-60">Đoạn giới thiệu (hiện dưới H1)</span>
          <RichTextEditor
            value={conf.introHtml}
            resetKey={`index-${tab}`}
            onChange={(html) => upd({ introHtml: html })}
            placeholder="Giới thiệu ngắn về trang tổng hợp game…"
          />
        </div>
        <div className="flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={conf.robots.index}
              onChange={(e) => upd({ robots: { ...conf.robots, index: e.target.checked } })}
            />
            Robots: index
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={conf.robots.follow}
              onChange={(e) => upd({ robots: { ...conf.robots, follow: e.target.checked } })}
            />
            Robots: follow
          </label>
        </div>
        {err && <p className="whitespace-pre-line text-red-600">{err}</p>}
        {msg && <p className="text-green-700">{msg}</p>}
        <button
          onClick={saveIndex}
          disabled={busy}
          className="rounded bg-snake px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Đang lưu…' : `Lưu cấu hình (${tab.toUpperCase()})`}
        </button>
      </div>
    </div>
  );
}
