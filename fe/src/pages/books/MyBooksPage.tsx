import { useEffect, useState } from "react";
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
        const params: any = {};
        const testEmail = (import.meta as any).env?.VITE_PURCHASED_TEST_EMAIL;
        if (testEmail) params.email = String(testEmail);
        if ((import.meta as any).env?.DEV) params.includePending = 1;
        const forceAll = (import.meta as any).env?.VITE_PURCHASED_FORCE_ALL;
        if (forceAll) params.forceAll = 1;

        const res = await bookApi.getBookOrderAndOrderitem(params);
        const payload = res?.data as any;
        const list: BookDto[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : [];
        setBooks(list);
      } catch (err) {
        setError("Không thể tải danh sách sách đã mua.");
        setBooks([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleReadPdf = async (id: string) => {
    try {
      const res = await bookApi.getPdfUrl(id);
      const url = (res as any)?.url || (res as any)?.data?.url;
      if (typeof url === "string" && url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      console.error("Không thể mở PDF", e);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">Sách của tôi</h1>
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Sách của tôi</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {books.length === 0 ? (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {books.map((b) => (
            <div
              key={b._id}
              className="book-card cursor-pointer bg-white rounded-xl shadow hover:shadow-lg transition flex flex-col"
            >
              {/* Ảnh full-size */}
              <div className="image-wrapper">
                <img
                  src={b.images?.[0] || "/no-image.png"}
                  alt={b.title}
                  className="w-full h-64 object-cover rounded-t-xl"
                />
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="book-title font-semibold text-gray-800 line-clamp-2">
                    {b.title}
                  </h3>
                  {b.author && (
                    <p className="book-author text-sm text-gray-500 mt-1">
                      {b.author}
                    </p>
                  )}
                  <p className="book-price text-green-700 font-semibold mt-2">
                    {typeof b.price_cents === "number"
                      ? `${b.price_cents.toLocaleString("vi-VN")}đ`
                      : "Miễn phí"}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Link
                    to={`/books/${b._id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Xem sách
                  </Link>
                  {b.pdf_url ? (
                    <button
                      onClick={() => handleReadPdf(b._id)}
                      className="text-green-600 hover:underline text-sm"
                    >
                      📖 Đọc PDF
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm">Chưa có PDF</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
