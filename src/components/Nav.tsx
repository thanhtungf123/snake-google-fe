import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import LanguageSwitcher from './LanguageSwitcher';
import AuthNav from './AuthNav';

interface BrandSettings {
  siteTitle?: string;
  logoUrl?: string;
}

export default function Nav({ settings }: { settings?: BrandSettings }) {
  const t = useTranslations('Nav');
  const title = settings?.siteTitle?.trim() || 'Snake';
  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-black/10 px-4 py-3">
      <Link href="/" className="mr-auto flex items-center gap-2 text-lg font-bold text-snake">
        {settings?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logoUrl} alt={title} className="h-7 w-auto object-contain" />
        ) : (
          <span>🐍</span>
        )}
        <span>{title}</span>
      </Link>
      <Link href="/leaderboard" className="hover:underline">
        {t('leaderboard')}
      </Link>
      <Link href="/how-to-play" className="hover:underline">
        {t('howToPlay')}
      </Link>
      <Link href="/about" className="hover:underline">
        {t('about')}
      </Link>
      <AuthNav />
      <LanguageSwitcher />
    </nav>
  );
}
