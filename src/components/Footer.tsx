import { useTranslations } from 'next-intl';
import type { FooterLink } from '@/lib/settings';

// Footer: dòng chữ (admin đặt, fallback bản quyền) + hàng liên kết (admin thêm).
// Link ngoài mở tab mới và có rel an toàn; link nội bộ (bắt đầu bằng "/") mở cùng tab.
export default function Footer({ text, links = [] }: { text?: string; links?: FooterLink[] }) {
  const t = useTranslations('Footer');
  const valid = links.filter((l) => l.label.trim() && l.url.trim());

  return (
    <footer className="border-t border-black/10 px-4 py-6 text-center text-sm opacity-70">
      <p>{text?.trim() || t('rights')}</p>
      {valid.length > 0 && (
        <nav className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
          {valid.map((l, i) => {
            const internal = l.url.startsWith('/');
            return (
              <a
                key={`${l.url}-${i}`}
                href={l.url}
                className="underline hover:opacity-100"
                {...(internal ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
              >
                {l.label}
              </a>
            );
          })}
        </nav>
      )}
    </footer>
  );
}
