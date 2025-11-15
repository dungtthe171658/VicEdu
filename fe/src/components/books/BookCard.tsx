import type { BookDto } from "../../types/book.d";
import { useNavigate } from "react-router-dom";
import "./BookCard.css";
import { useCart } from "../../contexts/CartContext";
import { useState } from "react";

interface BookCardProps {
  book: BookDto;
  purchasedBookIds?: Set<string>; // nhận từ page
}

const BookCard = ({ book, purchasedBookIds }: BookCardProps) => {
  const navigate = useNavigate();
  const { books: cartBooks, addBookItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleCardClick = () => {
    navigate(`/books/${book._id}`);
  };

  const isInCart = cartBooks.some((b) => String(b._id) === String(book._id));
  const hasPurchased = purchasedBookIds?.has(book._id) ?? false;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInCart || hasPurchased || isAdding) return;

    setIsAdding(true);
    setTimeout(() => {
      addBookItem({
        _id: book._id,
        title: book.title,
        price_cents: book.price_cents,
        images: book.images ?? [],
      });
      setIsAdding(false);
      alert(`Đã thêm "${book.title}" vào giỏ hàng!`);
    }, 400);
  };

  const priceVND = (book.price_cents || 0).toLocaleString("vi-VN", {
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
      </div>

      <div className="book-content">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author || "Tác giả không rõ"}</p>
        <p className="book-price">{priceVND}</p>

        <button
          className={`add-to-cart-btn ${
            isInCart || hasPurchased ? "disabled" : isAdding ? "loading" : ""
          }`}
          onClick={handleAddToCart}
          disabled={isInCart || hasPurchased || isAdding}
        >
          {hasPurchased
            ? "Bạn đã mua sách này"
            : isInCart
            ? "Đã có trong giỏ hàng"
            : isAdding
            ? "Đang thêm..."
            : "🛒 Thêm vào giỏ hàng"}
        </button>

        {hasPurchased && book.pdf_url && (
          <a
            href={book.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="download-pdf-link"
          >
            📖 Read book
          </a>
        )}
      </div>
    </div>
  );
};

export default BookCard;
