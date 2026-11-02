import type { ReactNode } from 'react';

type Tone = 'neutral' | 'accent' | 'success' | 'warn' | 'danger';

// Nền icon theo tông màu.
const ICON_TONE: Record<Tone, string> = {
  neutral: 'bg-[var(--ad-surface-2)] text-[var(--ad-muted)]',
  accent: 'bg-[var(--ad-accent-weak)] text-[var(--ad-accent)]',
  success: 'bg-[var(--ad-ok-weak)] text-[var(--ad-ok)]',
  warn: 'bg-[var(--ad-warn-weak)] text-[var(--ad-warn)]',
  danger: 'bg-[var(--ad-danger-weak)] text-[var(--ad-danger)]',
};

const VALUE_TONE: Record<Tone, string> = {
  neutral: 'text-[var(--ad-text)]',
  accent: 'text-[var(--ad-text)]',
  success: 'text-[var(--ad-ok)]',
  warn: 'text-[var(--ad-warn)]',
  danger: 'text-[var(--ad-danger)]',
};

export function StatCard({
  label,
  value,
  icon,
  tone = 'neutral',
  hint,
}: {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  hint?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--ad-border)] bg-[var(--ad-surface)] p-4 shadow-[var(--ad-shadow)] transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ad-muted)]">
            {label}
          </div>
          <div className={`mt-1.5 text-2xl font-bold tabular-nums ${VALUE_TONE[tone]}`}>
            {value}
          </div>
          {hint && <div className="mt-1 text-xs text-[var(--ad-muted)]">{hint}</div>}
        </div>
        {icon && (
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${ICON_TONE[tone]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
