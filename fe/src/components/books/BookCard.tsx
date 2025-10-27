import type { BookDto } from "../../types/book.d";
import { useNavigate } from "react-router-dom";
import "./BookCard.css";
import { useCart } from "../../contexts/CartContext";
import { useState } from "react";

interface BookCardProps {
  book: BookDto;
}

const BookCard = ({ book }: BookCardProps) => {
  const navigate = useNavigate();
  const { addBookItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleCardClick = () => {
    navigate(`/books/${book._id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock || isAdding) return;

    setIsAdding(true);

    // Hiệu ứng UX: delay nhẹ để cảm giác "đang thêm"
    setTimeout(() => {
      addBookItem({
        _id: book._id,
        title: book.title,
        price_cents: book.price_cents,
        stock: book.stock ?? 0,
        image: book.images ?? [],
        quantity: 1,
      });

      setIsAdding(false);
      alert(`✅ Đã thêm "${book.title}" vào giỏ hàng!`);
    }, 400);
  };

  const priceVND = (book.price_cents || 0).toLocaleString("vi-VN", {
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
          className={`add-to-cart-btn ${
            isOutOfStock ? "disabled" : isAdding ? "loading" : ""
          }`}
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAdding}
        >
          {isOutOfStock
            ? "Hết hàng"
            : isAdding
            ? "Đang thêm..."
            : "🛒 Thêm vào giỏ hàng"}
        </button>
      </div>
    </div>
  );
};

export default BookCard;
