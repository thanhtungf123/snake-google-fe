// Khung nhúng game (iframe GamePix). URL đã được backend kiểm host (*.gamepix.com) khi lưu.
// sandbox giới hạn quyền của iframe; allow mở các tính năng cần cho game (toàn màn hình, tay cầm…).
export default function GameEmbed({
  embedUrl,
  title,
  aspectW = 16,
  aspectH = 9,
}: {
  embedUrl: string;
  title: string;
  aspectW?: number;
  aspectH?: number;
}) {
  if (!embedUrl) return null;
  return (
    <div
      className="w-full overflow-hidden rounded-lg border border-black/10 bg-black"
      style={{ aspectRatio: `${aspectW} / ${aspectH}` }}
    >
      <iframe
        src={embedUrl}
        title={title}
        className="h-full w-full"
        loading="lazy"
        allow="fullscreen; autoplay; gamepad; accelerometer; gyroscope"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock allow-orientation-lock"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
