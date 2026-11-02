'use client';

// Biểu đồ tự vẽ (không dùng thư viện): cột (bar) + vành khuyên (donut).
// Màu lấy từ token CSS admin nên tự đổi theo sáng/tối.

export interface BarDatum {
  label: string; // nhãn đầy đủ (tooltip)
  short: string; // nhãn ngắn hiển thị dưới trục
  value: number;
}

export function BarChart({ data, height = 180 }: { data: BarDatum[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.round((d.value / max) * 100);
          return (
            <div key={i} className="group relative flex flex-1 flex-col items-center justify-end">
              {/* tooltip */}
              <div className="pointer-events-none absolute -top-1 z-10 -translate-y-full whitespace-nowrap rounded-md bg-[var(--ad-text)] px-2 py-1 text-xs font-medium text-[var(--ad-surface)] opacity-0 shadow transition-opacity group-hover:opacity-100">
                {d.label}: <span className="tabular-nums">{d.value}</span>
              </div>
              <div
                className="w-full rounded-t-[4px] bg-[var(--ad-accent)] opacity-80 transition-[height,opacity] group-hover:opacity-100"
                style={{ height: `${Math.max(h, d.value > 0 ? 3 : 0)}%`, minHeight: d.value > 0 ? 3 : 0 }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[10px] leading-tight text-[var(--ad-muted)]"
          >
            {d.short}
          </div>
        ))}
      </div>
    </div>
  );
}

export interface DonutSegment {
  label: string;
  value: number;
  color: string; // giá trị màu (vd 'var(--ad-ok)')
}

export function DonutChart({
  segments,
  size = 160,
  thickness = 20,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke="var(--ad-surface-2)"
            strokeWidth={thickness}
          />
          {total > 0 &&
            segments.map((s, i) => {
              const frac = s.value / total;
              const dash = frac * c;
              const seg = (
                <circle
                  key={i}
                  cx={cx}
                  cy={cx}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += dash;
              return seg;
            })}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-xl font-bold tabular-nums text-[var(--ad-text)]">{total}</div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--ad-muted)]">Tổng</div>
          </div>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: s.color }}
            />
            <span className="text-[var(--ad-muted)]">{s.label}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums text-[var(--ad-text)]">
              {s.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
