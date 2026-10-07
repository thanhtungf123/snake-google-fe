'use client';

import { useEffect, useRef } from 'react';

interface Props {
  value: string;
  // Khi resetKey đổi (vd chuyển trang/ngôn ngữ đang sửa) thì nạp lại nội dung.
  resetKey: string | number;
  onChange: (html: string) => void;
  placeholder?: string;
}

// Trình soạn thảo WYSIWYG kiểu Word cho nội dung CMS. Chỉ dùng các thẻ mà
// sanitizer cho phép (h2–h4, p, b/i/u/s, ul/ol/li, blockquote, a).
export default function RichTextEditor({ value, resetKey, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  function emit() {
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function exec(cmd: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  }

  function onBlock(e: React.ChangeEvent<HTMLSelectElement>) {
    const tag = e.target.value;
    exec('formatBlock', tag);
    e.target.selectedIndex = 0;
  }

  function addLink() {
    const url = window.prompt('Nhập URL liên kết:', 'https://');
    if (url) exec('createLink', url);
  }

  // Giữ vùng chọn khi bấm nút (ngăn mất focus khỏi editor).
  const keep = (e: React.MouseEvent) => e.preventDefault();

  const btn =
    'rounded px-2 py-1 text-sm hover:bg-black/10 min-w-[2rem] border border-black/10';

  return (
    <div className="rounded border border-black/15">
      <div className="flex flex-wrap items-center gap-1 border-b border-black/10 bg-black/[0.03] p-1.5">
        <select
          onMouseDown={keep}
          onChange={onBlock}
          defaultValue=""
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
        <button type="button" onMouseDown={keep} onClick={() => exec('bold')} className={`${btn} font-bold`} title="Đậm">
          B
        </button>
        <button type="button" onMouseDown={keep} onClick={() => exec('italic')} className={`${btn} italic`} title="Nghiêng">
          I
        </button>
        <button type="button" onMouseDown={keep} onClick={() => exec('underline')} className={`${btn} underline`} title="Gạch chân">
          U
        </button>
        <button type="button" onMouseDown={keep} onClick={() => exec('strikethrough')} className={`${btn} line-through`} title="Gạch ngang">
          S
        </button>
        <span className="mx-1 h-5 w-px bg-black/10" />
        <button type="button" onMouseDown={keep} onClick={() => exec('insertUnorderedList')} className={btn} title="Danh sách chấm">
          • ≡
        </button>
        <button type="button" onMouseDown={keep} onClick={() => exec('insertOrderedList')} className={btn} title="Danh sách số">
          1. ≡
        </button>
        <button type="button" onMouseDown={keep} onClick={() => exec('formatBlock', '<blockquote>')} className={btn} title="Trích dẫn">
          ❝
        </button>
        <span className="mx-1 h-5 w-px bg-black/10" />
        <button type="button" onMouseDown={keep} onClick={addLink} className={btn} title="Chèn liên kết">
          🔗
        </button>
        <button type="button" onMouseDown={keep} onClick={() => exec('unlink')} className={btn} title="Bỏ liên kết">
          ⛓️‍💥
        </button>
        <button type="button" onMouseDown={keep} onClick={() => exec('removeFormat')} className={btn} title="Xoá định dạng">
          ⌫
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        data-placeholder={placeholder ?? ''}
        className="rte-area min-h-[12rem] max-w-none px-3 py-2 text-sm outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-black/15 [&_blockquote]:pl-3 [&_blockquote]:opacity-80 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_a]:text-snake [&_a]:underline"
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
