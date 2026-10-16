import { API_URL } from './api';
import type { Locale } from '@/i18n/routing';

export interface GameCard {
  key: string;
  slug: string;
  title: string;
  thumbnailUrl: string;
  cardDescription: string;
}

export interface GamesIndexData {
  title: string;
  metaDescription: string;
  h1: string;
  introHtml: string;
  robots: { index: boolean; follow: boolean };
}

export interface GamesCatalog {
  index: GamesIndexData;
  games: GameCard[];
}

export interface GameDetail {
  key: string;
  locale: Locale;
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  thumbnailUrl: string;
  embedUrl: string;
  aspectW: number;
  aspectH: number;
  requireLandscape: boolean;
  bodyHtml: string;
  robots: { index: boolean; follow: boolean };
  // { locale: slug } của các bản dịch đã publish (gồm cả game hiện tại).
  alternates: Record<string, string>;
}

// Trang tổng hợp game (cấu hình + danh sách). null nếu lỗi mạng.
export async function getGamesCatalog(locale: Locale): Promise<GamesCatalog | null> {
  try {
    const res = await fetch(`${API_URL}/api/games/${locale}`, {
      next: { revalidate: 60, tags: ['games'] },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return (await res.json()) as GamesCatalog;
  } catch {
    return null;
  }
}

// Chi tiết 1 game + game liên quan. null nếu không có / chưa publish.
export async function getGame(
  locale: Locale,
  slug: string
): Promise<{ game: GameDetail; related: GameCard[] } | null> {
  try {
    const res = await fetch(`${API_URL}/api/games/${locale}/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60, tags: ['games'] },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.game) return null;
    return { game: data.game, related: data.related ?? [] };
  } catch {
    return null;
  }
}

export interface GameSitemapRow {
  key: string;
  locale: Locale;
  slug: string;
  updatedAt: string | null;
}

// Danh sách game đã publish cho sitemap. Mảng rỗng nếu lỗi.
export async function getGamesForSitemap(): Promise<GameSitemapRow[]> {
  try {
    const res = await fetch(`${API_URL}/api/games/sitemap`, {
      next: { revalidate: 300, tags: ['games'] },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.rows ?? [];
  } catch {
    return [];
  }
}
