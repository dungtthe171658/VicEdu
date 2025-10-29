import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import bookApi from "../../api/bookApi";
import type { BookDto } from "../../types/book.d";
import type { Category } from "../../types/category.d";
import reviewClient, { type ReviewDto } from "../../api/reviewClient";
import "./BookDetailPage.css";

const isCategoryPopulated = (
  category: string | Category
): category is Category => typeof category === "object" && !!category && "name" in category;

const getImageSrc = (img?: string) => {
  if (!img) return "/no-image.png";
  if (img.startsWith("data:") || img.startsWith("http")) return img;
  return "/no-image.png";
};

const formatVND = (n: number) =>
  (typeof n === "number" ? n : Number(n || 0)).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [book, setBook] = useState<BookDto | null>(null);
  const [sameCategoryBooks, setSameCategoryBooks] = useState<BookDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [added, setAdded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reviews
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<{ count: number; average: number; breakdown: Record<string, number> } | null>(null);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string>("");

  // Load book
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await bookApi.getById(id);
        const bookData: BookDto = res.data;
        setBook(bookData);

        const categoryId = typeof bookData.category_id === "object" ? (bookData.category_id as any)._id : bookData.category_id;
        if (categoryId) {
          const catRes = await bookApi.getAll({ categoryId });
          const books: BookDto[] = catRes.data;
          setSameCategoryBooks(books.filter((b) => b._id !== id));
        } else {
          setSameCategoryBooks([]);
        }
      } catch (err) {
        console.error("Error fetching book:", err);
        setError("Không thể tải sách. Vui lòng thử lại.");
      } finally {
        setLoading(false);
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
    if (!book || (book.stock ?? 0) <= 0) return;
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const exists = cart.find((item: BookDto) => item._id === book._id);
    if (!exists) {
      cart.push(book);
      localStorage.setItem("cart", JSON.stringify(cart));
      setAdded(true);
    } else {
      alert("This book is already in the cart.");
    }
  };

  const handlePrevImage = () => {
    if (!book?.images || book.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev === 0 ? book.images!.length - 1 : prev - 1));
  };
  const handleNextImage = () => {
    if (!book?.images || book.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev === book.images!.length - 1 ? 0 : prev + 1));
  };

  if (loading) return <p className="loading-text">Đang tải sách...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!book) return <p className="error-text">Không tìm thấy sách.</p>;

  const priceVND = formatVND(book.price_cents || 0);
  const stock = book.stock ?? 0;

  return (
    <div className="book-detail-page">
      <div className="book-detail-container">
        {/* Images */}
        <div className="book-images">
          <button className="prev-btn" onClick={handlePrevImage}>‹</button>
          <img className="book-main-image" src={getImageSrc(book.images?.[currentImageIndex])} alt={`${book.title} - ${currentImageIndex + 1}`} />
          <button className="next-btn" onClick={handleNextImage}>›</button>
        </div>

        {book?.images && book.images.length > 1 && (
          <div className="book-thumbnails">
            {book.images.map((img, idx) => (
              <img key={idx} src={getImageSrc(img)} alt={`Thumbnail ${idx + 1}`} className={currentImageIndex === idx ? "active" : ""} onClick={() => setCurrentImageIndex(idx)} />
            ))}
          </div>
        )}

        <br />
        <h1>{book.title}</h1>
        {book.author && <p className="author">{book.author}</p>}

        {isCategoryPopulated(book.category_id) && (
          <p className="category">Thể loại: <span>{book.category_id.name}</span></p>
        )}

        {book.description && <p className="description">{book.description}</p>}
        <p className="price">{priceVND}</p>

        <p className={`stock ${stock > 0 ? "in-stock" : "out-of-stock"}`}>{stock > 0 ? `Còn ${stock} cuốn` : "Hết hàng"}</p>

        <button className={`add-to-cart-btn ${added ? "added" : ""}`} onClick={handleAddToCart} disabled={added || stock <= 0}>
          {stock <= 0 ? "Đã hết hàng" : added ? "Đã thêm vào giỏ hàng" : "Thêm vào giỏ hàng"}
        </button>
      </div>

      {/* Same-category books */}
      <div className="book-same-category">
        <h3>Sách cùng thể loại</h3>
        {sameCategoryBooks.length > 0 ? (
          <ul>
            {sameCategoryBooks.map((b) => (
              <li key={b._id} className={(b.stock ?? 0) <= 0 ? "out-of-stock-item" : ""}>
                <img src={getImageSrc(b.images?.[0])} alt={b.title} />
                <Link to={`/books/${b._id}`}>{b.title}</Link>
                {(b.stock ?? 0) <= 0 && <span className="out-of-stock-label">Hết hàng</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p>Không có sách cùng thể loại.</p>
        )}
      </div>

      {/* Reviews */}
      <section className="book-reviews mt-8 bg-white shadow border border-gray-100 rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-4">Đánh giá sách</h3>

        {/* Summary + Histogram */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-3">
            {(() => {
              const avg = reviewSummary?.average ?? 0;
              const count = reviewSummary?.count ?? reviews.length;
              return (
                <>
                  <div className="flex items-center text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < Math.round(avg) ? "fill-current" : ""}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">{avg} / 5 • {count} đánh giá</span>
                </>
              );
            })()}
          </div>
          {reviewSummary && (
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((r) => {
                const total = reviewSummary.count || 1;
                const c = reviewSummary.breakdown[String(r)] || 0;
                const pct = Math.round((c / total) * 100);
                return (
                  <div key={r} className="flex items-center gap-2 text-sm">
                    <span className="w-8 text-gray-600">{r}★</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded">
                      <div className="h-2 bg-amber-500 rounded" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-right text-gray-600">{c}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Write review */}
        <div className="mb-6 border rounded-xl p-4 bg-gray-50">
          <h4 className="font-semibold mb-2">Viết đánh giá của bạn</h4>
          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm text-gray-700">Chấm điểm:</label>
            <select value={ratingInput} onChange={(e) => setRatingInput(Number(e.target.value))} className="border rounded-lg p-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <textarea
            placeholder="Chia sẻ cảm nhận của bạn về sách..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            className="w-full border rounded-lg p-3 min-h-[100px]"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              disabled={submittingReview}
              onClick={async () => {
                if (!book?._id) return;
                setSubmittingReview(true);
                setReviewMessage("");
                try {
                  await reviewClient.createBookReview(String(book._id), ratingInput, commentInput);
                  setCommentInput("");
                  setRatingInput(5);
                  setReviewMessage("Đã gửi đánh giá, chờ duyệt.");
                } catch (e: any) {
                  setReviewMessage(e?.message || "Không thể gửi đánh giá. Vui lòng đăng nhập và thử lại.");
                } finally {
                  setSubmittingReview(false);
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              Gửi đánh giá
            </button>
            {reviewMessage && <span className="text-sm text-gray-600">{reviewMessage}</span>}
          </div>
        </div>

        {/* Review list */}
        {loadingReviews ? (
          <div className="text-gray-500">Đang tải đánh giá...</div>
        ) : reviews.length === 0 ? (
          <div className="text-gray-500">Chưa có đánh giá nào.</div>
        ) : (
          <ul className="space-y-4">
            {reviews.map((rv) => {
              const userRaw = (rv as any).user_id || (rv as any).user;
              const nameRaw = typeof userRaw === "object" ? (userRaw?.name ?? "") : "";
              const displayName = typeof nameRaw === "string" && nameRaw.trim().length > 0 ? nameRaw.trim() : "Người dùng";
              return (
                <li key={rv._id} className="border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-gray-800 flex items-center gap-2">{displayName}</div>
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Number((rv as any).rating || 0) ? "fill-current" : ""}`} />
                      ))}
                    </div>
                  </div>
                  {(rv as any).comment && <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{(rv as any).comment}</p>}
                  {(rv as any).created_at && (
                    <div className="text-xs text-gray-400 mt-2">{new Date((rv as any).created_at as any).toLocaleString("vi-VN")}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
