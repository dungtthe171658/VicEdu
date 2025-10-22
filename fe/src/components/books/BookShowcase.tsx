import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import bookApi from "../../api/bookApi";
import type { BookDto } from "../../types/book.d";
import "./BookShowcase.css";

const BookShowcase = () => {
  const [books, setBooks] = useState<BookDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await bookApi.getAll();
        const data: BookDto[] = Array.isArray(res.data) ? res.data : res;

        // Lấy 4 sách ngẫu nhiên
        const randomBooks = data.sort(() => 0.5 - Math.random()).slice(0, 4);
        setBooks(randomBooks);
      } catch (err) {
        console.error("Lỗi khi tải sách:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  return (
    <section className="book-showcase">
      <h2 className="section-title">Bộ Sưu Tập Sách Mới Nhất</h2>

      {loading ? (
        <div className="spinner"></div>
      ) : (
        <div className="book-grid">
          {books.map((book) => (
            <div key={book._id} className="book-card">
              <img
                src={book.images || "/default-book.png"}
                alt={book.title}
                className="book-image"
              />
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-price">
                  {book.price_cents
                    ? book.price_cents.toLocaleString("vi-VN") + " ₫"
                    : "Đang cập nhật"}
                </p>
                <Link to={`/books/${book._id}`} className="book-btn">
                  Xem chi tiết
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="see-more-container">
        <Link to="/books" className="see-more-btn">
          Xem thêm
        </Link>
      </div>
    </section>
  );
};

export default BookShowcase;
