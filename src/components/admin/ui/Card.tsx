import type { ReactNode } from 'react';

// Card nền surface + viền + bóng nhẹ, theo token admin (tự đổi sáng/tối).
export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-[var(--ad-border)] bg-[var(--ad-surface)] shadow-[var(--ad-shadow)] ${
        padded ? 'p-4 sm:p-5' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

// Tiêu đề card: tiêu đề + mô tả bên trái, vùng hành động bên phải.
export function CardHeader({
  title,
  description,
  actions,
  className = '',
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold leading-tight">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-[var(--ad-muted)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
