import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--ad-accent)] text-[var(--ad-on-accent)] hover:opacity-90 border border-transparent',
  secondary:
    'bg-[var(--ad-surface)] text-[var(--ad-text)] border border-[var(--ad-border)] hover:bg-[var(--ad-hover)]',
  danger: 'bg-[var(--ad-danger)] text-white hover:opacity-90 border border-transparent',
  ghost: 'bg-transparent text-[var(--ad-text)] hover:bg-[var(--ad-hover)] border border-transparent',
};

const SIZES: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
