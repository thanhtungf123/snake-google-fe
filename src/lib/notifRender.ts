// Dựng tiêu đề/nội dung thông báo từ dữ liệu, dùng chung cho Hộp thư và chuông popup.
// `t` là translator gốc của next-intl (useTranslations() không namespace), có .has() và gọi được.
export interface NotifLike {
  type: 'achievement' | 'challenge' | 'reward' | 'system';
  messageKey: string | null;
  data: Record<string, unknown> | null;
  title: string | null;
  body: string | null;
}

type Translator = {
  (key: string, values?: Record<string, string | number>): string;
  has: (key: string) => boolean;
};

export function renderNotif(t: Translator, n: NotifLike): { title: string; body: string } {
  if (n.title || n.body) return { title: n.title ?? '', body: n.body ?? '' };

  const data: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(n.data ?? {})) {
    if (typeof v === 'string' || typeof v === 'number') data[k] = v;
  }
  const code = typeof data.code === 'string' ? data.code : null;

  if (code && n.type === 'achievement') {
    if (t.has(`Achievements.defs.${code}.name`)) data.name = t(`Achievements.defs.${code}.name`);
    if (t.has(`Achievements.defs.${code}.desc`)) data.desc = t(`Achievements.defs.${code}.desc`);
  }
  if (code && n.type === 'challenge') {
    if (t.has(`Challenges.defs.${code}.name`)) data.name = t(`Challenges.defs.${code}.name`, data);
  }

  const key = n.messageKey;
  const titleKey = key ? `Inbox.messages.${key}` : null;
  const bodyKey = key ? `Inbox.messages.${key}Body` : null;
  const title = titleKey && t.has(titleKey) ? t(titleKey, data) : (key ?? '');
  const body = bodyKey && t.has(bodyKey) ? t(bodyKey, data) : '';
  return { title, body };
}
