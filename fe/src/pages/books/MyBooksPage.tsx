import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import bookApi from "../../api/bookApi";
import type { BookDto } from "../../types/book.d";

export default function MyBooksPage() {
  const [books, setBooks] = useState<BookDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Sử dụng API mới để lấy sách từ bookHistory
        const res = await bookApi.getMyBooksFromHistory();
        const payload = res?.data as any;
        const list: BookDto[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : [];
        setBooks(list);
      } catch (err) {
        console.error("Error loading my books:", err);
        setError("Không thể tải danh sách sách đã mua.");
        setBooks([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasBooks = useMemo(() => books.length > 0, [books]);

  const handleReadPdf = async (id: string) => {
    try {
      const res = await bookApi.getPdfUrl(id);
      const url = (res as any)?.url || (res as any)?.data?.url;
      if (typeof url === "string" && url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      // Silently ignore for now
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">Sách của tôi</h1>
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Sách của tôi</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!hasBooks ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <p className="text-gray-600 mb-4">Bạn chưa mua sách nào.</p>
          <Link
            to="/books"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Khám phá sách
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((b) => (
            <div key={b._id} className="bg-white rounded-xl shadow hover:shadow-md transition p-4">
              <img
                src={b.images?.[0] || "https://placehold.co/600x360"}
                alt={b.title}
                className="w-full h-40 object-cover rounded-lg"
              />
              <div className="mt-3">
                <h3 className="font-semibold text-gray-800 line-clamp-2">{b.title}</h3>
                {b.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{b.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {typeof b.price === "number"
                      ? `${(b.price || 0).toLocaleString("vi-VN")}đ`
                      : "Miễn phí"}
                  </div>
                  <div className="flex items-center gap-3">
                    <Link to={`/books/${b._id}`} className="text-blue-600 hover:underline text-sm">
                      Xem sách
                    </Link>
                    {b.pdf_url ? (
                      <button
                        onClick={() => handleReadPdf(b._id)}
                        className="text-green-600 hover:underline text-sm"
                      >
                        Đọc PDF
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">Chưa có PDF</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
