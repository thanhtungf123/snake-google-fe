'use client';

import { useEffect, useRef, useState } from 'react';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message?: string;
  reasonLabel?: string; // nếu có => hiện ô nhập lý do
  reasonRequired?: boolean;
  reasonDefault?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

// Popup xác nhận dùng chung cho admin. Hủy/đóng LUÔN hủy hành động (không tự chạy).
export default function ConfirmModal({
  open,
  title,
  message,
  reasonLabel,
  reasonRequired = false,
  reasonDefault = '',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [reason, setReason] = useState(reasonDefault);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Reset ô lý do mỗi lần mở.
  useEffect(() => {
    if (open) {
      setReason(reasonDefault);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, reasonDefault]);

  // Esc = hủy.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const canConfirm = !reasonLabel || !reasonRequired || reason.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        {message && <p className="mt-1 text-sm opacity-70">{message}</p>}

        {reasonLabel && (
          <label className="mt-3 block">
            <span className="mb-1 block text-sm opacity-70">
              {reasonLabel}
              {reasonRequired && <span className="text-red-600"> *</span>}
            </span>
            <textarea
              ref={inputRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-snake"
            />
          </label>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded bg-black/5 px-4 py-2 text-sm hover:bg-black/10"
          >
            {cancelText}
          </button>
          <button
            onClick={() => canConfirm && onConfirm(reason.trim())}
            disabled={!canConfirm}
            className={`rounded px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-snake hover:opacity-90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
