import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import bookApi from "../../api/bookApi";
import type { BookDto } from "../../types/book.d";
import type { Category } from "../../types/category.d";
import { useCart } from "../../contexts/CartContext";
import "./BookDetailPage.css";

// Kiểm tra category có đầy đủ dữ liệu
const isCategoryPopulated = (
  category: string | Category
): category is Category => {
  return (
    typeof category === "object" && category !== null && "name" in category
  );
};

// Lấy src ảnh
const getImageSrc = (img?: string) => {
  if (!img) return "/no-image.png";
  if (
    img.startsWith("data:") ||
    img.startsWith("http") ||
    img.startsWith("https")
  ) {
    return img;
  }
  return "/no-image.png";
};

const BookDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { addBookItem } = useCart();

  const [book, setBook] = useState<BookDto | null>(null);
  const [sameCategoryBooks, setSameCategoryBooks] = useState<BookDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Button state ---
  const [added, setAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // --- Fetch book & same category books ---
  useEffect(() => {
    if (!id) return;

    const fetchBook = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await bookApi.getById(id);
        const bookData: BookDto = res.data;
        setBook(bookData);

        const categoryId =
          typeof bookData.category_id === "object"
            ? bookData.category_id._id
            : bookData.category_id;

        if (categoryId) {
          const catRes = await bookApi.getAll({ categoryId });
          const books: BookDto[] = catRes.data;
          setSameCategoryBooks(books.filter((b) => b._id !== id));
        } else {
          setSameCategoryBooks([]);
        }
      } catch (err) {
        console.error("Error fetching book:", err);
        setError("Không thể tải sách. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  if (loading) return <p className="loading-text">Đang tải sách...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!book) return <p className="error-text">Không tìm thấy sách.</p>;

  const stock = book.stock ?? 0;
  const isOutOfStock = stock <= 0;

  // --- Handle add to cart ---
  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!book || isOutOfStock || isAdding || added) return;

    setIsAdding(true);

    // Giả lập UX async / delay
    setTimeout(() => {
      addBookItem({
        _id: book._id,
        title: book.title,
        price_cents: book.price_cents,
        stock,
        image: book.images ?? [],
        quantity: 1,
      });

      setIsAdding(false);
      setAdded(true);
      alert(`✅ Đã thêm "${book.title}" vào giỏ hàng!`);
    }, 400);
  };

  // --- Image carousel ---
  const handlePrevImage = () => {
    if (!book?.images || book.images.length === 0) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? book.images!.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!book?.images || book.images.length === 0) return;
    setCurrentImageIndex((prev) =>
      prev === book.images!.length - 1 ? 0 : prev + 1
    );
  };

  const priceVND = book.price_cents.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  return (
    <div className="book-detail-page">
      <div className="book-detail-container">
        {/* --- Ảnh chính + Carousel --- */}
        <div className="book-images">
          <button className="prev-btn" onClick={handlePrevImage}>
            ◀
          </button>
          <img
            className="book-main-image"
            src={getImageSrc(book.images?.[currentImageIndex])}
            alt={`${book.title} - ${currentImageIndex + 1}`}
          />
          <button className="next-btn" onClick={handleNextImage}>
            ▶
          </button>
        </div>

        {book?.images && book.images.length > 1 && (
          <div className="book-thumbnails">
            {book.images.map((img, idx) => (
              <img
                key={idx}
                src={getImageSrc(img)}
                alt={`Thumbnail ${idx + 1}`}
                className={currentImageIndex === idx ? "active" : ""}
                onClick={() => setCurrentImageIndex(idx)}
              />
            ))}
          </div>
        )}

        <h1>{book.title}</h1>
        {book.author && <p className="author">{book.author}</p>}

        {isCategoryPopulated(book.category_id) && (
          <p className="category">
            Thể loại: <span>{book.category_id.name}</span>
          </p>
        )}

        {book.description && <p className="description">{book.description}</p>}

        <p className="price">{priceVND}</p>

        <p className={`stock ${isOutOfStock ? "out-of-stock" : "in-stock"}`}>
          {isOutOfStock ? "Hết hàng" : `Còn ${stock} cuốn`}
        </p>

        {/* --- Button thêm vào giỏ hàng theo logic BookCard --- */}
        <button
          className={`add-to-cart-btn ${
            isOutOfStock
              ? "disabled"
              : isAdding
              ? "loading"
              : added
              ? "added"
              : ""
          }`}
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAdding || added}
        >
          {isOutOfStock
            ? "Hết hàng"
            : isAdding
            ? "Đang thêm..."
            : added
            ? "✅ Đã thêm vào giỏ hàng"
            : "🛒 Thêm vào giỏ hàng"}
        </button>
      </div>

      {/* --- Sidebar sách cùng thể loại --- */}
      <div className="book-same-category">
        <h3>Sách cùng thể loại</h3>
        {sameCategoryBooks.length > 0 ? (
          <ul>
            {sameCategoryBooks.map((b) => (
              <li
                key={b._id}
                className={(b.stock ?? 0) <= 0 ? "out-of-stock-item" : ""}
              >
                <img src={getImageSrc(b.images?.[0])} alt={b.title} />
                <Link to={`/books/${b._id}`}>{b.title}</Link>
                {(b.stock ?? 0) <= 0 && (
                  <span className="out-of-stock-label">Hết hàng</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>Không có sách nào cùng thể loại.</p>
        )}
      </div>
    </div>
  );
};

export default BookDetailPage;
