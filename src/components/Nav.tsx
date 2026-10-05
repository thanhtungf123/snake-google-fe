import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import LanguageSwitcher from './LanguageSwitcher';
import AuthNav from './AuthNav';

export default function Nav() {
  const t = useTranslations('Nav');
  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-black/10 px-4 py-3">
      <Link href="/" className="mr-auto text-lg font-bold text-snake">
        🐍 Snake
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
