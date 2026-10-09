import { Skeleton } from '@/components/ui/Skeleton';
import Spinner from '@/components/ui/Spinner';

// Fallback điều hướng (App Router bọc page trong Suspense). Giữ Nav/Footer, chỉ phần
// nội dung hiện khung chờ — tránh màn hình trắng/đứng hình khi chuyển trang.
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8" aria-busy="true">
      <div className="mb-6 flex items-center gap-3 text-snake">
        <Spinner className="h-6 w-6" />
        <Skeleton className="h-7 w-48" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    </div>
  );
}
