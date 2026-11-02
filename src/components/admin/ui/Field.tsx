import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from 'react';

// Lớp dùng chung cho input/select/textarea trong admin.
const base =
  'w-full rounded-lg border border-[var(--ad-border)] bg-[var(--ad-surface)] px-3 py-2 text-sm text-[var(--ad-text)] outline-none transition-colors placeholder:text-[var(--ad-muted)] focus:border-[var(--ad-accent)] disabled:opacity-50';

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${base} ${className}`} {...rest} />;
}

export function Textarea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${base} ${className}`} {...rest} />;
}

export function Select({
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className={`${base} cursor-pointer pr-8 ${className}`} {...rest}>
      {children}
    </select>
  );
}

// Nhãn + control, dùng khi cần label phía trên.
export function Label({
  label,
  required,
  children,
  hint,
  className = '',
}: {
  label: ReactNode;
  required?: boolean;
  children: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-[var(--ad-text)]">
        {label}
        {required && <span className="text-[var(--ad-danger)]"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-[var(--ad-muted)]">{hint}</span>}
    </label>
  );
}
