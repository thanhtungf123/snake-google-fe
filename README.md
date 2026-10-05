# Google Snake Web — bản viết lại (Next.js)

Website chơi rắn săn mồi, viết lại theo *Kế hoạch v3*. Xem kiến trúc đầy đủ ở
[`../docs/KIEN-TRUC-TONG-QUAN-V1.md`](../docs/KIEN-TRUC-TONG-QUAN-V1.md).

## Techstack
Next.js (App Router) · TypeScript · Tailwind CSS · next-intl (EN/VI) · MongoDB Atlas (Mongoose) · Zod.

## Chạy dev

```bash
cd frontend
npm install
cp .env.example .env.local   # rồi điền MONGODB_URI từ MongoDB Atlas
npm run dev                  # http://localhost:3000
```

> `MONGODB_URI` chỉ cần khi chạy các API dùng DB (Sprint 2+). Trang chủ + game canvas
> chạy được mà không cần DB.

## Trạng thái (Sprint 1 — nền tảng)
- [x] Scaffold Next.js + TS + Tailwind
- [x] i18n EN (`/`) + VI (`/vi/`) với slug riêng, canonical + hreflang + sitemap/robots
- [x] Engine game canvas tất định (seed + replay) — `src/lib/game/`
- [x] Trang chủ chơi được (local, chưa lưu điểm)
- [x] Models MongoDB: User/GameSession/Score/SeoContent/AuditLog
- [x] Nền guest (cookie ở middleware)
- [x] Trang `/mods/` nhúng game modded cũ (`public/legacy-mods/`), không xếp hạng

## Chưa làm (Sprint 2+)
- Auth đầy đủ (login/register/forgot-password) + nâng cấp guest→user
- API `game/start` + `game/submit` (validate + replay + rate limit)
- Leaderboard thật (aggregation theo ngày/tuần/tháng/all-time)
- Admin, nội dung SEO sửa từ DB, email reset mật khẩu

## Cấu trúc chính
```
src/
  app/[locale]/      # trang EN/VI (home, leaderboard, mods, how-to-play, rewards, about)
  app/sitemap.ts, robots.ts
  components/        # Nav, Footer, LanguageSwitcher, game/SnakeGame
  i18n/              # routing + messages EN/VI
  lib/game/          # engine canvas (dùng chung client + server để replay)
  lib/db/            # kết nối Mongo + models
  lib/seo/           # helper metadata/canonical/hreflang
public/legacy-mods/  # game modded cũ (iframe cho /mods)
```
