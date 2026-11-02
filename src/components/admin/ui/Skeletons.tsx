// Skeleton tải cho khu admin (dùng class .skeleton toàn cục + token nền).

// Khối thanh công cụ (ô tìm/lọc) giả.
export function ToolbarSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="skeleton h-9 flex-1 rounded-lg" style={{ minWidth: 200 }} />
      <div className="skeleton h-9 w-28 rounded-lg" />
      <div className="skeleton h-9 w-28 rounded-lg" />
    </div>
  );
}

// Bảng giả: header + N dòng.
export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--ad-border)] bg-[var(--ad-surface)] shadow-[var(--ad-shadow)]">
      <div className="flex gap-4 border-b border-[var(--ad-border)] bg-[var(--ad-surface-2)] px-3 py-2.5">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-3.5 flex-1 rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-t border-[var(--ad-border)] px-3 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="skeleton h-4 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Lưới thẻ KPI giả.
export function StatGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-24 rounded-xl" />
      ))}
    </div>
  );
}
