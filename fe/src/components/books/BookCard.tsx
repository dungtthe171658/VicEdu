import type { BookDto } from "../../types/book.d";
import { useNavigate } from "react-router-dom";
import "./BookCard.css";

interface BookCardProps {
  book: BookDto;
  onAddToCart?: (book: BookDto) => void;
}

const BookCard = ({ book, onAddToCart }: BookCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/books/${book._id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(book);
  };

  const priceVND = (book.price_cents / 100).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  const isOutOfStock = !book.stock || book.stock <= 0;

  return (
    <div
      className={`book-card ${isOutOfStock ? "out-of-stock" : ""}`}
      onClick={handleCardClick}
    >
      <div className="image-wrapper">
        <img
          src={book.images?.[0] || "/no-image.png"}
          alt={book.title}
          className={`book-image ${isOutOfStock ? "dimmed" : ""}`}
        />
        {isOutOfStock && <div className="sold-out-overlay">Hết hàng</div>}
      </div>

      <div className="book-content">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author || "Tác giả không rõ"}</p>
        <p className="book-price">{priceVND}</p>
        <p className="book-stock">
          {isOutOfStock ? "Số lượng: 0" : `Số lượng: ${book.stock}`}
        </p>

        <button
          className={`add-to-cart-btn ${isOutOfStock ? "disabled" : ""}`}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          🛒 Thêm vào giỏ hàng
        </button>
      </div>
    </div>
  );
};

export default BookCard;
