'use client';

import { useEffect, useState } from 'react';
import { adminGet, adminSend } from '@/lib/adminApi';

interface FooterLink {
  label: string;
  url: string;
}
interface Settings {
  siteTitle: string;
  logoUrl: string;
  faviconUrl: string;
  footerText: string;
  footerLinks: FooterLink[];
}
interface Signature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

const EMPTY: Settings = {
  siteTitle: '',
  logoUrl: '',
  faviconUrl: '',
  footerText: '',
  footerLinks: [],
};

export default function AdminSettings() {
  const [form, setForm] = useState<Settings>(EMPTY);
  const [cloudinaryEnabled, setCloudinaryEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<null | 'logo' | 'favicon'>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    adminGet<{ settings: Settings; cloudinaryEnabled: boolean }>('/api/admin/settings')
      .then((d) => {
        setForm({ ...EMPTY, ...d.settings, footerLinks: d.settings.footerLinks ?? [] });
        setCloudinaryEnabled(d.cloudinaryEnabled);
      })
      .catch((e) => setErr(e.message));
  }, []);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // --- Liên kết footer ---
  const addLink = () =>
    setForm((f) => ({ ...f, footerLinks: [...f.footerLinks, { label: '', url: '' }] }));
  const updateLink = (i: number, key: keyof FooterLink, v: string) =>
    setForm((f) => ({
      ...f,
      footerLinks: f.footerLinks.map((l, idx) => (idx === i ? { ...l, [key]: v } : l)),
    }));
  const removeLink = (i: number) =>
    setForm((f) => ({ ...f, footerLinks: f.footerLinks.filter((_, idx) => idx !== i) }));

  async function uploadToCloudinary(file: File): Promise<string> {
    const sig = await adminGet<Signature>('/api/admin/upload/signature?folder=site');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('api_key', sig.apiKey);
    fd.append('timestamp', String(sig.timestamp));
    fd.append('folder', sig.folder);
    fd.append('signature', sig.signature);
    const r = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
      method: 'POST',
      body: fd,
    });
    const d = await r.json();
    if (!r.ok || !d.secure_url) throw new Error(d?.error?.message || 'Upload thất bại');
    return d.secure_url as string;
  }

  async function onPick(kind: 'logo' | 'favicon', file: File | undefined) {
    if (!file) return;
    setErr(null);
    setMsg(null);
    setUploading(kind);
    try {
      const url = await uploadToCloudinary(file);
      set(kind === 'logo' ? 'logoUrl' : 'faviconUrl', url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      // Bỏ các dòng link trống trước khi gửi (backend yêu cầu label + URL hợp lệ).
      const payload = {
        ...form,
        footerLinks: form.footerLinks.filter((l) => l.label.trim() && l.url.trim()),
      };
      await adminSend('/api/admin/settings', 'PUT', payload);
      setMsg('Đã lưu cấu hình. Tải lại trang để thấy thay đổi header/footer/favicon.');
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const field = 'w-full rounded border border-black/15 px-3 py-2 text-sm';

  return (
    <div className="max-w-xl space-y-5">
      <h2 className="text-xl font-semibold">Cấu hình site</h2>

      {!cloudinaryEnabled && (
        <p className="rounded bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          ⚠ Chưa cấu hình Cloudinary (CLOUDINARY_* trong .env backend) — không upload ảnh được. Bạn
          vẫn có thể dán URL ảnh trực tiếp.
        </p>
      )}
      {err && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      {msg && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}

      <form onSubmit={save} className="space-y-5">
        <label className="block text-sm">
          <span className="mb-1 block opacity-60">Tiêu đề header (chữ cạnh logo)</span>
          <input
            className={field}
            value={form.siteTitle}
            onChange={(e) => set('siteTitle', e.target.value)}
            placeholder="Snake"
          />
        </label>

        <ImageField
          label="Logo header"
          url={form.logoUrl}
          uploading={uploading === 'logo'}
          disabled={!cloudinaryEnabled}
          onPick={(f) => onPick('logo', f)}
          onClear={() => set('logoUrl', '')}
          onUrl={(u) => set('logoUrl', u)}
          field={field}
        />

        <ImageField
          label="Favicon (icon tab trình duyệt)"
          url={form.faviconUrl}
          uploading={uploading === 'favicon'}
          disabled={!cloudinaryEnabled}
          onPick={(f) => onPick('favicon', f)}
          onClear={() => set('faviconUrl', '')}
          onUrl={(u) => set('faviconUrl', u)}
          field={field}
          small
        />

        <label className="block text-sm">
          <span className="mb-1 block opacity-60">Nội dung footer</span>
          <textarea
            className={field}
            rows={2}
            value={form.footerText}
            onChange={(e) => set('footerText', e.target.value)}
            placeholder="A fan-made snake game…"
          />
        </label>

        {/* Liên kết footer */}
        <div className="text-sm">
          <span className="mb-1 block opacity-60">
            Liên kết footer (tiêu đề + URL). Link nội bộ bắt đầu bằng “/” (vd /vi/p/gioi-thieu/),
            link ngoài mở tab mới.
          </span>
          <div className="space-y-2">
            {form.footerLinks.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={`${field} flex-1`}
                  value={l.label}
                  onChange={(e) => updateLink(i, 'label', e.target.value)}
                  placeholder="Nhãn (vd: Giới thiệu)"
                />
                <input
                  className={`${field} flex-[2]`}
                  value={l.url}
                  onChange={(e) => updateLink(i, 'url', e.target.value)}
                  placeholder="https://… hoặc /vi/p/slug/"
                />
                <button
                  type="button"
                  onClick={() => removeLink(i)}
                  className="flex-none rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  title="Xoá link"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addLink}
            className="mt-2 rounded border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5"
          >
            + Thêm liên kết
          </button>
        </div>

        <button
          disabled={busy || uploading !== null}
          className="rounded bg-snake px-5 py-2 font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Đang lưu…' : 'Lưu'}
        </button>
      </form>
    </div>
  );
}

function ImageField({
  label,
  url,
  uploading,
  disabled,
  onPick,
  onClear,
  onUrl,
  field,
  small,
}: {
  label: string;
  url: string;
  uploading: boolean;
  disabled: boolean;
  onPick: (f: File | undefined) => void;
  onClear: () => void;
  onUrl: (u: string) => void;
  field: string;
  small?: boolean;
}) {
  return (
    <div className="text-sm">
      <span className="mb-1 block opacity-60">{label}</span>
      <div className="flex items-center gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={label}
            className={`${small ? 'h-8 w-8' : 'h-12'} rounded border border-black/10 object-contain`}
          />
        ) : (
          <span className="opacity-40">(chưa có)</span>
        )}
        <input
          type="file"
          accept="image/*"
          disabled={disabled || uploading}
          onChange={(e) => onPick(e.target.files?.[0])}
          className="text-xs"
        />
        {uploading && <span className="text-xs opacity-60">Đang tải…</span>}
        {url && (
          <button type="button" onClick={onClear} className="text-xs text-red-600 underline">
            Xoá
          </button>
        )}
      </div>
      <input
        className={`${field} mt-2`}
        value={url}
        onChange={(e) => onUrl(e.target.value)}
        placeholder="hoặc dán URL ảnh…"
      />
    </div>
  );
}
