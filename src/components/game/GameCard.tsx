import { Link } from '@/i18n/routing';
import type { GameCard as GameCardData } from '@/lib/games';

// Thẻ game trong lưới tổng hợp: ảnh thumbnail + tên + mô tả ngắn, bấm vào mở trang game.
export default function GameCard({ game }: { game: GameCardData }) {
  return (
    <Link
      href={{ pathname: '/games/[slug]', params: { slug: game.slug } }}
      className="group flex flex-col overflow-hidden rounded-lg border border-black/10 bg-white transition hover:shadow-md"
    >
      <div className="aspect-video w-full overflow-hidden bg-black/5">
        {game.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.thumbnailUrl}
            alt={game.title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm opacity-40">No image</div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-semibold text-snake group-hover:underline">{game.title}</h3>
        {game.cardDescription && (
          <p className="mt-1 line-clamp-3 text-sm opacity-70">{game.cardDescription}</p>
        )}
      </div>
    </Link>
  );
}
