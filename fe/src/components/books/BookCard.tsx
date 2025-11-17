import type { BookDto } from "../../types/book.d";
import { useNavigate } from "react-router-dom";
import "./BookCard.css";
import { useCart } from "../../contexts/CartContext";
import { useState } from "react";

interface BookCardProps {
  book: BookDto;
  isPurchased?: boolean;
}

const BookCard = ({ book, isPurchased }: BookCardProps) => {
  const navigate = useNavigate();
  const { addBookItem, books: cartBooks } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const hasPurchased = Boolean(isPurchased);
  const isInCart = cartBooks.some((item) => item._id === book._id);

  const handleCardClick = () => {
    navigate(`/books/${book._id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdding || hasPurchased || isInCart) return;

    setIsAdding(true);

    setTimeout(() => {
      addBookItem({
        _id: book._id,
        title: book.title,
        price: book.price,
        images: book.images ?? [],
        quantity: 1,
      });

      setIsAdding(false);
      alert(`Đã thêm "${book.title}" vào giỏ hàng!`);
    }, 400);
  };

  const priceVND = (book.price || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  return (
    <div className="book-card" onClick={handleCardClick}>
      <div className="image-wrapper">
        <img
          src={book.images?.[0] || "/no-image.png"}
          alt={book.title}
          className="book-image"
        />
        {hasPurchased && (
          <div className="sold-out-overlay">Đã mua</div>
        )}
      </div>

      <div className="book-content">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">
          {book.author || "Tác giả không rõ"}
        </p>
        <p className="book-price">{priceVND}</p>

        {!hasPurchased && !isInCart && (
          <button
            className={`add-to-cart-btn ${
              isAdding ? "loading" : ""
            }`}
            onClick={handleAddToCart}
            disabled={isAdding}
          >
            {isAdding ? "Đang thêm..." : "Thêm vào giỏ hàng"}
          </button>
        )}
        {!hasPurchased && isInCart && (
          <button
            className="add-to-cart-btn"
            disabled
            style={{ opacity: 0.6, cursor: "not-allowed" }}
          >
            Đã có trong giỏ hàng
          </button>
        )}
      </div>
    </div>
  );
};

export default BookCard;

