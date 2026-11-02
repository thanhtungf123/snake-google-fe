import type { ReactNode } from 'react';

type Tone = 'neutral' | 'accent' | 'success' | 'warn' | 'danger';

const TONES: Record<Tone, string> = {
  neutral:
    'bg-[var(--ad-surface-2)] text-[var(--ad-muted)] border border-[var(--ad-border)]',
  accent: 'bg-[var(--ad-accent-weak)] text-[var(--ad-accent)] border border-transparent',
  success: 'bg-[var(--ad-ok-weak)] text-[var(--ad-ok)] border border-transparent',
  warn: 'bg-[var(--ad-warn-weak)] text-[var(--ad-warn)] border border-transparent',
  danger: 'bg-[var(--ad-danger-weak)] text-[var(--ad-danger)] border border-transparent',
};

export function Badge({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
