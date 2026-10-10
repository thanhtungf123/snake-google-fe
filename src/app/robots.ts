import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/metadata';

const BASE = SITE_URL;

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
