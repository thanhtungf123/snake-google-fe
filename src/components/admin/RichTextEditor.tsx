'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { adminGet } from '@/lib/adminApi';

interface Props {
  value: string;
  // Khi resetKey đổi (vd chuyển trang/ngôn ngữ đang sửa) thì nạp lại nội dung.
  resetKey: string | number;
  onChange: (html: string) => void;
  placeholder?: string;
}

interface Fmt {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  ul: boolean;
  ol: boolean;
  quote: boolean;
  block: string; // 'p' | 'h2' | 'h3' | 'h4' | 'blockquote' | ''
}

const EMPTY_FMT: Fmt = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  ul: false,
  ol: false,
  quote: false,
  block: '',
};

// Trình soạn thảo WYSIWYG kiểu Word cho nội dung CMS. Chỉ dùng các thẻ mà
// sanitizer cho phép (h2–h4, p, b/i/u/s, ul/ol/li, blockquote, a).
export default function RichTextEditor({ value, resetKey, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [fmt, setFmt] = useState<Fmt>(EMPTY_FMT);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Đọc định dạng tại vùng chọn hiện tại (chỉ khi con trỏ nằm trong editor).
  const updateFmt = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !el.contains(sel.anchorNode)) return;
    const block = (document.queryCommandValue('formatBlock') || '').toLowerCase();
    try {
      setFmt({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikethrough'),
        ul: document.queryCommandState('insertUnorderedList'),
        ol: document.queryCommandState('insertOrderedList'),
        quote: block === 'blockquote',
        block,
      });
    } catch {
      /* ignore */
    }
  }, []);

  // Nạp nội dung ban đầu / khi đổi bản ghi đang sửa (không phụ thuộc value để khỏi nhảy con trỏ).
  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = value || '';
      try {
        document.execCommand('defaultParagraphSeparator', false, 'p');
      } catch {
        /* ignore */
      }
    }
    setFmt(EMPTY_FMT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  // Theo dõi thay đổi vùng chọn để cập nhật trạng thái nút.
  useEffect(() => {
    document.addEventListener('selectionchange', updateFmt);
    return () => document.removeEventListener('selectionchange', updateFmt);
  }, [updateFmt]);

  function emit() {
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function exec(cmd: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
    updateFmt();
  }

  function onBlock(e: React.ChangeEvent<HTMLSelectElement>) {
    exec('formatBlock', e.target.value);
  }

  function addLink() {
    const url = window.prompt('Nhập URL liên kết:', 'https://');
    if (url) exec('createLink', url);
  }

  // Chèn ảnh: upload file lên Cloudinary (chữ ký admin) rồi chèn <img> tại con trỏ.
  // Hoặc dán thẳng URL ảnh nếu không chọn file.
  async function onPickImage(file: File | undefined) {
    if (!file) return;
    setUploadingImg(true);
    try {
      const sig = await adminGet<{
        cloudName: string;
        apiKey: string;
        timestamp: number;
        folder: string;
        signature: string;
      }>('/api/admin/upload/signature?folder=content');
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
      ref.current?.focus();
      document.execCommand('insertImage', false, d.secure_url as string);
      emit();
    } catch (e) {
      window.alert((e as Error).message);
    } finally {
      setUploadingImg(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function addImageByUrl() {
    const url = window.prompt('Dán URL ảnh:', 'https://');
    if (url && /^https?:\/\//i.test(url)) {
      ref.current?.focus();
      document.execCommand('insertImage', false, url);
      emit();
    }
  }

  // Giữ vùng chọn khi bấm nút (ngăn mất focus khỏi editor).
  const keep = (e: React.MouseEvent) => e.preventDefault();

  // Giá trị hiển thị cho ô cỡ chữ: khớp heading hiện tại, còn lại coi là văn bản thường.
  const blockVal = ['h2', 'h3', 'h4'].includes(fmt.block)
    ? `<${fmt.block}>`
    : fmt.quote
      ? ''
      : '<p>';

  const btn = 'rounded px-2 py-1 text-sm min-w-[2rem] border border-black/10';
  const cls = (on: boolean) =>
    `${btn} ${on ? 'bg-snake text-white border-snake' : 'hover:bg-black/10'}`;

  return (
    <div className="rounded border border-black/15">
      <div className="flex flex-wrap items-center gap-1 border-b border-black/10 bg-black/[0.03] p-1.5">
        <select
          value={blockVal}
          onChange={onBlock}
          className="rounded border border-black/10 px-2 py-1 text-sm"
          title="Kiểu / cỡ chữ"
        >
          <option value="" disabled>
            Cỡ chữ
          </option>
          <option value="<p>">Văn bản thường</option>
          <option value="<h2>">Tiêu đề lớn (H2)</option>
          <option value="<h3>">Tiêu đề vừa (H3)</option>
          <option value="<h4>">Tiêu đề nhỏ (H4)</option>
        </select>
        <span className="mx-1 h-5 w-px bg-black/10" />
        <button type="button" onMouseDown={keep} onClick={() => exec('bold')} className={`${cls(fmt.bold)} font-bold`} title="Đậm">
          B
        </button>
        <button type="button" onMouseDown={keep} onClick={() => exec('italic')} className={`${cls(fmt.italic)} italic`} title="Nghiêng">
          I
        </button>
        <button type="button" onMouseDown={keep} onClick={() => exec('underline')} className={`${cls(fmt.underline)} underline`} title="Gạch chân">
          U
        </button>
        <button type="button" onMouseDown={keep} onClick={() => exec('strikethrough')} className={`${cls(fmt.strike)} line-through`} title="Gạch ngang">
          S
        </button>
        <span className="mx-1 h-5 w-px bg-black/10" />
        <button type="button" onMouseDown={keep} onClick={() => exec('insertUnorderedList')} className={cls(fmt.ul)} title="Danh sách chấm">
          • ≡
        </button>
        <button type="button" onMouseDown={keep} onClick={() => exec('insertOrderedList')} className={cls(fmt.ol)} title="Danh sách số">
          1. ≡
        </button>
        <button type="button" onMouseDown={keep} onClick={() => exec('formatBlock', '<blockquote>')} className={cls(fmt.quote)} title="Trích dẫn">
          ❝
        </button>
        <span className="mx-1 h-5 w-px bg-black/10" />
        <button type="button" onMouseDown={keep} onClick={addLink} className={cls(false)} title="Chèn liên kết">
          🔗
        </button>
        <button type="button" onMouseDown={keep} onClick={() => exec('unlink')} className={cls(false)} title="Bỏ liên kết">
          ⛓️‍💥
        </button>
        <span className="mx-1 h-5 w-px bg-black/10" />
        <button
          type="button"
          onMouseDown={keep}
          onClick={() => fileRef.current?.click()}
          className={cls(false)}
          disabled={uploadingImg}
          title="Tải ảnh lên (Cloudinary)"
        >
          {uploadingImg ? '…' : '🖼️'}
        </button>
        <button type="button" onMouseDown={keep} onClick={addImageByUrl} className={cls(false)} title="Chèn ảnh từ URL">
          🖼️🔗
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPickImage(e.target.files?.[0])}
        />
        <span className="mx-1 h-5 w-px bg-black/10" />
        <button type="button" onMouseDown={keep} onClick={() => exec('removeFormat')} className={cls(false)} title="Xoá định dạng">
          ⌫
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onKeyUp={updateFmt}
        onMouseUp={updateFmt}
        onFocus={updateFmt}
        data-placeholder={placeholder ?? ''}
        className="rte-area min-h-[12rem] max-w-none px-3 py-2 text-sm outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-black/15 [&_blockquote]:pl-3 [&_blockquote]:opacity-80 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_a]:text-snake [&_a]:underline [&_img]:my-2 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded"
      />
      <style jsx>{`
        .rte-area:empty:before {
          content: attr(data-placeholder);
          opacity: 0.4;
        }
      `}</style>
    </div>
  );
}
