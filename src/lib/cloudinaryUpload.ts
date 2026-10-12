import { adminGet } from './adminApi';

interface Signature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

// Upload 1 ảnh lên Cloudinary bằng chữ ký do backend ký (api_secret không ra client).
// Trả về secure_url. `folder` phân loại ảnh trên Cloudinary (vd 'games', 'site').
export async function uploadImageToCloudinary(file: File, folder = 'site'): Promise<string> {
  const sig = await adminGet<Signature>(
    `/api/admin/upload/signature?folder=${encodeURIComponent(folder)}`
  );
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', sig.apiKey);
  fd.append('timestamp', String(sig.timestamp));
  fd.append('folder', sig.folder);
  fd.append('signature', sig.signature);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: 'POST',
    body: fd,
  });
  const d = await r.json();
  if (!r.ok || !d.secure_url) throw new Error(d?.error?.message || 'Upload thất bại');
  return d.secure_url as string;
}
