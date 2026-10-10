import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

// POST /revalidate — backend gọi sau khi admin lưu để xoá cache NGAY (nội dung hiện tức thì).
// Nằm ngoài /api (vì /api đã bị Nginx route sang backend) và ngoài middleware i18n.
// Bảo mật tuỳ chọn: đặt REVALIDATE_SECRET giống nhau ở backend + frontend. Bỏ trống = không kiểm.
const SECRET = process.env.REVALIDATE_SECRET || '';
const ALLOWED = new Set(['content', 'settings', 'pages']);

export async function POST(req: NextRequest) {
  let body: { tag?: string; secret?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad body' }, { status: 400 });
  }

  if (SECRET && body.secret !== SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (!body.tag || !ALLOWED.has(body.tag)) {
    return NextResponse.json({ error: 'bad tag' }, { status: 400 });
  }

  revalidateTag(body.tag);
  return NextResponse.json({ ok: true, tag: body.tag, revalidatedAt: Date.now() });
}
