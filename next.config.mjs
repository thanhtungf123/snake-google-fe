import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(), microphone=(), camera=()',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // Trang tùy chỉnh đã bỏ tiền tố /p/ → chuyển hướng vĩnh viễn URL cũ sang URL mới ở gốc
  // để giữ SEO và link đã chia sẻ (cả bản EN lẫn VI).
  async redirects() {
    return [
      { source: '/p/:slug', destination: '/:slug', permanent: true },
      { source: '/vi/p/:slug', destination: '/vi/:slug', permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
