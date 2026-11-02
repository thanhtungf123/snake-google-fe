import { ToolbarSkeleton, TableSkeleton } from '@/components/admin/ui';

// Hiện trong lúc chuyển route /admin/* (trước khi trang đích sẵn sàng) → có phản hồi
// ngay thay vì màn hình trống/đứng im.
export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <ToolbarSkeleton />
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
}
