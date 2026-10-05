import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin',
        '/login',
        '/register',
        '/forgot-password',
        '/account',
        '/profile',
        '/history',
        '/stats',
        '/vi/dang-nhap',
        '/vi/dang-ky',
        '/vi/quen-mat-khau',
        '/vi/tai-khoan',
        '/vi/ho-so',
        '/vi/lich-su',
        '/vi/thong-ke',
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
