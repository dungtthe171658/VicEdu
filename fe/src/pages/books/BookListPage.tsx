import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBooks } from "../../api/bookApi";

interface Book {
  _id: string;
  title: string;
  author: string;
  price: number;
  description?: string;
}

const BookListPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const data = await getBooks();
        setBooks(data);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  if (loading) return <p>Đang tải danh sách sách...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>📚 Danh sách sách</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
        {books.map((book) => (
          <div
            key={book._id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
            }}
          >
            <h3>{book.title}</h3>
            <p>Tác giả: {book.author}</p>
            <p>Giá: {book.price.toLocaleString()}₫</p>
            <Link to={`/books/${book._id}`}>Xem chi tiết</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookListPage;
