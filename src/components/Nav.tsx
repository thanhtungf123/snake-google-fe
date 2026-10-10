import NavClient from './NavClient';

interface BrandSettings {
  siteTitle?: string;
  logoUrl?: string;
}

// Header: thương hiệu + điều hướng. Toàn bộ tương tác (dropdown tài khoản, menu
// mobile, trạng thái đăng nhập) nằm trong NavClient (client component).
export default function Nav({ settings }: { settings?: BrandSettings }) {
  return <NavClient settings={settings} />;
}
