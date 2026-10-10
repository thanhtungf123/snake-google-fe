import { redirect } from 'next/navigation';

// Tab "Nội dung" đã gộp vào "Trang" (/admin/pages). Giữ route này để chuyển hướng link cũ.
export default function AdminContentRedirect() {
  redirect('/admin/pages/');
}
