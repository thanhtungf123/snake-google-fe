import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'vi'],
  defaultLocale: 'en',
  // EN không có prefix; VI nằm dưới /vi/
  localePrefix: 'as-needed',
  // Slug khác nhau theo ngôn ngữ (đúng bảng URL trong kế hoạch v3)
  pathnames: {
    '/': '/',
    '/leaderboard': {
      en: '/leaderboard',
      vi: '/bang-xep-hang',
    },
    '/how-to-play': {
      en: '/how-to-play',
      vi: '/cach-choi',
    },
    '/rewards': {
      en: '/rewards',
      vi: '/phan-thuong',
    },
    '/about': {
      en: '/about',
      vi: '/gioi-thieu',
    },
    '/login': {
      en: '/login',
      vi: '/dang-nhap',
    },
    '/register': {
      en: '/register',
      vi: '/dang-ky',
    },
    '/profile': {
      en: '/profile',
      vi: '/ho-so',
    },
    '/stats': {
      en: '/stats',
      vi: '/thong-ke',
    },
    '/history': {
      en: '/history',
      vi: '/lich-su',
    },
    '/account': {
      en: '/account',
      vi: '/tai-khoan',
    },
  },
});

export type Pathnames = keyof typeof routing.pathnames;
export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
