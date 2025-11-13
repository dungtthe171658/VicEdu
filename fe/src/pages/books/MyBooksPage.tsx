import { useEffect, useState } from "react";
import bookApi from "../../api/bookApi";
import type { BookDto } from "../../types/book.d";
import { useNavigate } from "react-router-dom";

export default function MyBooksPage() {
  const [books, setBooks] = useState<BookDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Đang tải sách của bạn...</p>;
  if (error) return <p>{error}</p>;
  if (!books.length) return <p>Bạn chưa mua sách nào.</p>;

  return (
    <div className="my-books-page">
      <h1>Sách của tôi</h1>
      <div className="books-grid">
        {books.map((book) => (
          <div key={book._id} className="book-card">
            <img
              src={book.images?.[0] || "/no-image.png"}
              alt={book.title}
              className="book-image"
              onClick={() => navigate(`/books/${book._id}`)}
            />
            <h3>{book.title}</h3>
            <p>{book.author || "Tác giả không rõ"}</p>

            {book.pdf_url ? (
              <a
                href={book.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                📖 Đọc sách
              </a>
            ) : (
              <button className="btn btn-secondary" disabled>
                Chưa có PDF
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
