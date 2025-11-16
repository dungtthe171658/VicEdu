import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import bookApi from "../../api/bookApi";
import type { BookDto } from "../../types/book.d";
import type { Category } from "../../types/category.d";
import "./BookDetailPage.css";
import { useCart } from "../../contexts/CartContext";

// Kiểm tra category có dữ liệu đầy đủ
const isCategoryPopulated = (
  category: string | Category
): category is Category => {
  return (
    typeof category === "object" && category !== null && "name" in category
  );
};

// Lấy src hiển thị cho ảnh, fallback nếu không có
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addBookItem, books: cartBooks } = useCart();

  const [purchasedBookIds, setPurchasedBookIds] = useState<Set<string>>(
    new Set()
  );

  const isInCart = book
    ? cartBooks.some((item) => item._id === book._id)
    : false;
  const hasPurchased = book ? purchasedBookIds.has(book._id) : false;
  const pdfUrl = hasPurchased ? book?.pdf_url : null;

  // --- Fetch chi tiết sách và sách cùng thể loại ---
  useEffect(() => {
    if (!id) return;

    const fetchBookAndRelated = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1️⃣ Chi tiết sách
        const res = await bookApi.getById(id);
        const bookData: BookDto = res.data;
        setBook(bookData);

        // 2️⃣ Sách cùng thể loại
        const categoryId =
          typeof bookData.category_id === "object"
            ? bookData.category_id._id
            : bookData.category_id;

        if (categoryId) {
          const catRes = await bookApi.getAll({ categoryId });
          const books: BookDto[] = catRes.data || [];
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

    fetchBookAndRelated();
  }, [id]);

  // --- Fetch sách đã mua của user (1 lần) ---
  useEffect(() => {
    const fetchPurchasedBooks = async () => {
      try {
        const res = await bookApi.getBookOrderAndOrderitem();
        const books = res.data?.data || [];
        const purchasedIds: string[] = books.map((b: any) => b._id);
        setPurchasedBookIds(new Set(purchasedIds));
      } catch (err) {
        console.error("Cannot fetch purchased books:", err);
        setPurchasedBookIds(new Set());
      }
    };
    fetchPurchasedBooks();
  }, []);

  // --- Thêm sách vào giỏ ---
  const handleAddToCartByContext = () => {
    if (!book || hasPurchased || isInCart) return;
    addBookItem({
      _id: book._id,
      title: book.title,
      price: book.price,
      images: Array.isArray(book.images) ? book.images : [],
    });
    alert(`Đã thêm "${book.title}" vào giỏ hàng!`);
  };

  // --- Chuyển ảnh ---
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

  const priceVND = book.price.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  return (
    <div className="book-detail-page">
      <div className="book-detail-container">
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

        <button
          className={`add-to-cart-btn`}
          onClick={handleAddToCartByContext}
          disabled={hasPurchased || isInCart}
        >
          {hasPurchased
            ? "Bạn đã mua sách này"
            : isInCart
            ? "Đã có trong giỏ hàng"
            : "Thêm vào giỏ hàng"}
        </button>

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

      <div className="book-same-category">
        <h3>Sách cùng thể loại</h3>
        {sameCategoryBooks.length > 0 ? (
          <ul>
            {sameCategoryBooks.map((b) => {
              const purchased = purchasedBookIds.has(b._id);
              return (
                <li key={b._id}>
                  <img src={getImageSrc(b.images?.[0])} alt={b.title} />
                  <Link to={`/books/${b._id}`}>{b.title}</Link>
                  {purchased && (
                    <span className="out-of-stock-label">Đã mua</span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p>Không có sách nào cùng thể loại.</p>
        )}
      </div>
    </div>
  );
};

export default BookDetailPage;
