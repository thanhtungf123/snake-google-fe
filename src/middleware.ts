import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Chỉ xử lý i18n. Guest/session cookie do server API (backend riêng) quản lý.
export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|legacy-mods|revalidate|.*\\..*).*)'],
};
