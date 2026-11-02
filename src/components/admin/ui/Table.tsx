import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';

// Bộ primitive bảng cho admin: header dính, hàng hover, viền theo token.
export function Table({
  children,
  className = '',
  minWidth = 640,
}: {
  children: ReactNode;
  className?: string;
  minWidth?: number;
}) {
  return (
    <div className="admin-scroll overflow-x-auto rounded-xl border border-[var(--ad-border)] bg-[var(--ad-surface)] shadow-[var(--ad-shadow)]">
      <table className={`w-full border-collapse text-sm ${className}`} style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="sticky top-0 z-10 bg-[var(--ad-surface-2)] text-[var(--ad-muted)]">
      {children}
    </thead>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function Tr({
  children,
  className = '',
  hover = true,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <tr
      className={`border-t border-[var(--ad-border)] ${
        hover ? 'transition-colors hover:bg-[var(--ad-hover)]' : ''
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function Th({
  children,
  className = '',
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <th
      className={`whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = '',
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <td className={`px-3 py-2.5 align-middle ${className}`} {...rest}>
      {children}
    </td>
  );
}

// Dòng trống / thông báo giữa bảng.
export function TableEmpty({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-10 text-center text-[var(--ad-muted)]">
        {children}
      </td>
    </tr>
  );
}
