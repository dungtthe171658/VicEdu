import { useEffect, useState } from "react";
import bookApi from "../../api/bookApi";
import categoryApi from "../../api/categoryApi"; // ✅ tách riêng API thể loại
import type { BookDto } from "../../types/book.d";
import type { CategoryDto } from "../../types/category.d";
import BookCard from "../../components/books/BookCard";
import "./BookListPage.css";

const BookListPage = () => {
  const [books, setBooks] = useState<BookDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // --- Lấy danh sách thể loại ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryApi.getAll();
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error(" Không thể tải thể loại:", err);
      }
    };
    fetchCategories();
  }, []);

  // --- Lấy danh sách sách ---
  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {};

      if (selectedCategory) params.categoryId = selectedCategory;
      if (minPrice) params.minPrice = Number(minPrice) * 100; 
      if (maxPrice) params.maxPrice = Number(maxPrice) * 100;

      const res = await bookApi.getAll(params);
      if (Array.isArray(res.data)) {
        setBooks(res.data);
      }
    } catch (err) {
      console.error("❌ Lỗi khi tải sách:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chỉ chạy lần đầu

  // --- Xử lý filter ---
  const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchBooks();
  };

  if (loading)
    return (
      <div className="book-list-loader">
        <div className="spinner"></div>
      </div>
    );

  if (!books.length)
    return (
      <div className="book-list-empty">Không có sách nào để hiển thị 📚</div>
    );

  return (
    <div className="book-list-container">
      {/* --- Bộ lọc --- */}
      <aside className="book-list-filter">
        <h3>Bộ lọc</h3>
        <form onSubmit={handleFilterSubmit} className="filter-form">
          {/* Thể loại */}
          <div className="filter-group">
            <label htmlFor="category">Thể loại</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Tất cả</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Giá */}
          <div className="filter-group">
            <label>Giá (VND)</label>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Từ"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Đến"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="filter-btn">
            Áp dụng
          </button>
        </form>
      </aside>

      {/* --- Danh sách sách --- */}
      <div className="book-list-books">
        {books.map((book) => (
          <BookCard key={book._id} book={book} />
        ))}
      </div>
    </div>
  );
};

export default BookListPage;
