import Spinner from './Spinner';

// Bộ tải toàn trang/toàn vùng: spinner căn giữa. Dùng cho loading.tsx và các vùng chờ.
export default function PageLoader({
  label,
  minHeight = 'min-h-[50vh]',
}: {
  label?: string;
  minHeight?: string;
}) {
  return (
    <div
      className={`flex ${minHeight} flex-col items-center justify-center gap-3 text-snake`}
      role="status"
      aria-live="polite"
    >
      <Spinner className="h-8 w-8" />
      {label && <p className="text-sm opacity-70">{label}</p>}
    </div>
  );
}
