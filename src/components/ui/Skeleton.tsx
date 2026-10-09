// Khối skeleton + vài bố cục dựng sẵn, dùng chung cho các trạng thái đang tải.
// Giữ đúng kích thước nội dung thật để tránh layout shift khi dữ liệu về.

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

// Lưới ô thống kê (vd trang Hồ sơ / Thống kê).
export function StatTilesSkeleton({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  const colClass = cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3';
  return (
    <div className={`grid gap-3 ${colClass}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg bg-black/5 p-4">
          <Skeleton className="mx-auto mb-2 h-7 w-16" />
          <Skeleton className="mx-auto h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

// Bảng (danh sách điểm / lịch sử / bảng xếp hạng).
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

// Danh sách hàng (hộp thư / thử thách).
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-lg border border-black/10 p-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Thẻ lớn (phiếu nhận thưởng).
export function CardsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-5" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-black/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </div>
      ))}
    </div>
  );
}
