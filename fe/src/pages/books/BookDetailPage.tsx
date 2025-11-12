<<<<<<< HEAD
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
=======
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
>>>>>>> b90b7c107431d694c408d9079cc2bd949ea588c9
import bookApi from "../../api/bookApi";
import type { BookDto } from "../../types/book.d";
import type { Category } from "../../types/category.d";
import "./BookDetailPage.css";
import { useCart } from "../../contexts/CartContext";

const isCategoryPopulated = (
  category: string | Category
): category is Category => {
  return (
    typeof category === "object" && category !== null && "name" in category
  );
};

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
  const [book, setBook] = useState<BookDto | null>(null);
  const [sameCategoryBooks, setSameCategoryBooks] = useState<BookDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addBookItem } = useCart();

<<<<<<< HEAD
  // User purchase & pdf
  const [hasPurchased, setHasPurchased] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<{ count: number; average: number; breakdown: Record<string, number> } | null>(null);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string>("");

  // Load book
=======
>>>>>>> b90b7c107431d694c408d9079cc2bd949ea588c9
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

<<<<<<< HEAD
  // Load user purchase (PDF)
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoadingPdf(true);
        const res = await bookApi.getPdfUrl(id); // gọi endpoint /books/:id/pdf
        if (res.data?.pdf_url) {
          setHasPurchased(true);
          setPdfUrl(res.data.pdf_url);
        }
      } catch (err) {
        setHasPurchased(false);
        setPdfUrl(null);
      } finally {
        setLoadingPdf(false);
      }
    })();
  }, [id]);

  // Load reviews + summary for this book
  useEffect(() => {
    (async () => {
      if (!book?._id) return;
      try {
        setLoadingReviews(true);
        const [list, summary] = await Promise.all([
          reviewClient.listForBook(String(book._id)),
          reviewClient.getBookSummary(String(book._id)),
        ]);
        setReviews(Array.isArray(list) ? list : []);
        setReviewSummary(summary);
      } catch (e) {
        setReviews([]);
        setReviewSummary(null);
      } finally {
        setLoadingReviews(false);
      }
    })();
  }, [book?._id]);

  const handleAddToCart = () => {
    if (!book || (book.stock ?? 0) <= 0 || hasPurchased) return;
=======
  const _handleAddToCartLegacy = () => {
    if (!book || (book.stock ?? 0) <= 0) return;
>>>>>>> b90b7c107431d694c408d9079cc2bd949ea588c9
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const exists = cart.find((item: BookDto) => item._id === book._id);
    if (!exists) {
      cart.push(book);
      localStorage.setItem("cart", JSON.stringify(cart));
      setAdded(true);
    } else {
<<<<<<< HEAD
      alert("Sách đã có trong giỏ hàng.");
=======
      alert("Sách này đã có trong giỏ hàng 🛒");
>>>>>>> b90b7c107431d694c408d9079cc2bd949ea588c9
    }
  };

  const handleAddToCartByContext = () => {
    if (!book || (book.stock ?? 0) <= 0) return;
    addBookItem({
      _id: book._id,
      title: book.title,
      price_cents: book.price_cents,
      images: Array.isArray(book.images) ? book.images : [],
      stock: book.stock ?? 0,
      quantity: 1,
    });
    setAdded(true);
    try {
      alert(`Added "${book.title}" to cart!`);
    } catch {}
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

  const priceVND = book.price_cents.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  // --- Fix TypeScript warning stock undefined ---
  const stock = book.stock ?? 0;

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
        <br/>
        <h1>{book.title}</h1>
        {book.author && <p className="author">{book.author}</p>}

        {isCategoryPopulated(book.category_id) && (
          <p className="category">
            Thể loại: <span>{book.category_id.name}</span>
          </p>
        )}

        {book.description && <p className="description">{book.description}</p>}

        <p className="price">{priceVND}</p>

        {/* --- Hiển thị stock --- */}
        <p className={`stock ${stock > 0 ? "in-stock" : "out-of-stock"}`}>
          {stock > 0 ? `Còn ${stock} cuốn` : "Hết hàng"}
        </p>

<<<<<<< HEAD
        {/* Nút thêm vào giỏ hàng hoặc thông báo đã mua */}
        <button
          className={`add-to-cart-btn ${added ? "added" : ""}`}
          onClick={handleAddToCart}
          disabled={added || stock <= 0 || hasPurchased}
        >
          {stock <= 0
            ? "Đã hết hàng"
            : hasPurchased
            ? "Bạn đã mua sách này"
            : added
            ? "Đã thêm vào giỏ hàng"
            : "Thêm vào giỏ hàng"}
=======
        <button
          className={`add-to-cart-btn ${added ? "added" : ""}`}
          onClick={handleAddToCartByContext}
          disabled={added || stock <= 0}
        >
          {stock <= 0
            ? "❌ Hết hàng"
            : added
            ? "✅ Đã thêm vào giỏ hàng"
            : "🛒 Thêm vào giỏ hàng"}
>>>>>>> b90b7c107431d694c408d9079cc2bd949ea588c9
        </button>

        {/* Nút đọc sách nếu có PDF */}
        {hasPurchased && pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="read-pdf-btn bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 mt-2 inline-block"
          >
            📖 Đọc sách
          </a>
        )}
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
