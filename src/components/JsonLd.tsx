// Chèn structured data (schema.org) dạng JSON-LD vào trang.
// JSON.stringify ở đây an toàn: dữ liệu do code sinh ra, không phải input người dùng.
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
