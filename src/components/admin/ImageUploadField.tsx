'use client';

import { useState } from 'react';
import { uploadImageToCloudinary } from '@/lib/cloudinaryUpload';

// Ô chọn ảnh: upload thẳng lên Cloudinary (có xem trước + xoá). Vẫn cho dán URL thủ công
// để tương thích ảnh cũ / khi chưa cấu hình Cloudinary.
export default function ImageUploadField({
  label,
  value,
  onChange,
  folder = 'site',
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setErr(null);
    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file, folder);
      onChange(url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const field = 'w-full rounded border border-black/15 px-3 py-2 text-sm';

  return (
    <div className="text-sm">
      <span className="mb-1 block opacity-60">{label}</span>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={label}
            className="h-16 w-24 rounded border border-black/10 object-cover"
          />
        ) : (
          <span className="opacity-40">(chưa có ảnh)</span>
        )}
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => onPick(e.target.files?.[0])}
          className="text-xs"
        />
        {uploading && <span className="text-xs opacity-60">Đang tải…</span>}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-red-600 underline"
          >
            Xoá
          </button>
        )}
      </div>
      <input
        className={`${field} mt-2 font-mono text-xs`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="hoặc dán URL ảnh…"
      />
      {hint && <p className="mt-1 text-xs opacity-50">{hint}</p>}
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}
