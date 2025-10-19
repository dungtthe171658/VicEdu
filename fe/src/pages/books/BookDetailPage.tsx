import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import bookApi from "../../api/bookApi";
import type { BookDto } from "../../types/book.d";
import type { CategoryDto } from "../../types/category.d";
import "./BookDetailPage.css";

const isCategoryPopulated = (
  category: string | CategoryDto
): category is CategoryDto => {
  return typeof category === "object" && category !== null && "name" in category;
};

const getImageSrc = (img?: string) => {
  if (!img) return "/no-image.png";
  if (img.startsWith("data:") || img.startsWith("http") || img.startsWith("https")) {
    return img;
  }
  return "/no-image.png";
};

const BookDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<BookDto | null>(null);
  const [sameCategoryBooks, setSameCategoryBooks] = useState<BookDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const handleAddToCart = () => {
    if (!book) return;
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const exists = cart.find((item: BookDto) => item._id === book._id);
    if (!exists) {
      cart.push(book);
      localStorage.setItem("cart", JSON.stringify(cart));
      setAdded(true);
    } else {
      alert("Sách này đã có trong giỏ hàng 🛒");
    }
  };

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

  if (loading) return <p className="loading-text">Đang tải sách...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!book) return <p className="error-text">Không tìm thấy sách.</p>;

  const priceVND = (book.price_cents).toLocaleString("vi-VN", {
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
            src={getImageSrc(book.images?.[currentImageIndex])}
            alt={`${book.title} - ${currentImageIndex + 1}`}
          />
          <button className="next-btn" onClick={handleNextImage}>
            ▶
          </button>

          {/* --- Thumbnails nhỏ bên dưới --- */}
          {book.images?.length > 1 && (
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
        </div>

        <h1>{book.title}</h1>
        {book.author && <p className="author">{book.author}</p>}

        {isCategoryPopulated(book.category_id) && (
          <p className="category">
            Thể loại: <span>{book.category_id.name}</span>
          </p>
        )}

        {book.description && <p className="description">{book.description}</p>}
        <p className="price">{priceVND}</p>

        <button
          className={`add-to-cart-btn ${added ? "added" : ""}`}
          onClick={handleAddToCart}
          disabled={added}
        >
          {added ? "✅ Đã thêm vào giỏ hàng" : "🛒 Thêm vào giỏ hàng"}
        </button>
      </div>

      {/* --- Sidebar sách cùng thể loại --- */}
      <div className="book-same-category">
        <h3>Sách cùng thể loại</h3>
        {sameCategoryBooks.length > 0 ? (
          <ul>
            {sameCategoryBooks.map((b) => (
              <li key={b._id}>
                <img src={getImageSrc(b.images?.[0])} alt={b.title} />
                <Link to={`/books/${b._id}`}>{b.title}</Link>
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
