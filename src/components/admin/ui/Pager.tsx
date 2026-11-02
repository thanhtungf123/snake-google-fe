import { Button } from './Button';

// Phân trang dạng skip/limit, dùng chung cho các bảng admin.
export function Pager({
  total,
  skip,
  page,
  onChange,
}: {
  total: number;
  skip: number;
  page: number;
  onChange: (skip: number) => void;
}) {
  const from = total === 0 ? 0 : skip + 1;
  const to = Math.min(skip + page, total);
  return (
    <div className="flex items-center justify-between pt-1 text-sm text-[var(--ad-muted)]">
      <span className="tabular-nums">
        {from}–{to} / {total}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={skip === 0}
          onClick={() => onChange(Math.max(0, skip - page))}
        >
          ← Trước
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={to >= total}
          onClick={() => onChange(skip + page)}
        >
          Sau →
        </Button>
      </div>
    </div>
  );
}
