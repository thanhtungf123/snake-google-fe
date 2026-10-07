import { useTranslations } from 'next-intl';

export default function Footer({ text }: { text?: string }) {
  const t = useTranslations('Footer');
  return (
    <footer className="border-t border-black/10 px-4 py-6 text-center text-sm opacity-70">
      {text?.trim() || t('rights')}
    </footer>
  );
}
