import type { BookDto } from "../../types/book.d";
import { useNavigate } from "react-router-dom";
import "./BookCard.css";
import { useCart } from "../../contexts/CartContext";
import { useEffect, useState } from "react";

interface BookCardProps {
  book: BookDto;
}

const BookCard = ({ book }: BookCardProps) => {
  const navigate = useNavigate();
  const { addBookItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  const handleCardClick = () => {
    navigate(`/books/${book._id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdding || hasPurchased) return;

    setIsAdding(true);

    setTimeout(() => {
      addBookItem({
        _id: book._id,
        title: book.title,
        price_cents: book.price_cents,
        image: book.images ?? [],
        quantity: 1,
      });

      setIsAdding(false);
      alert(`Đã thêm "${book.title}" vào giỏ hàng!`);
    }, 400);
  };

  // Kiểm tra sách đã mua hay chưa
  useEffect(() => {
    const fetchPurchasedBooks = async () => {
      try {
        const res = await fetch("/orders/user-books", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data: string[] = await res.json();
        setHasPurchased(data.includes(book._id));
      } catch (err) {
        console.error("Không thể kiểm tra sách đã mua:", err);
      }
    };
    fetchPurchasedBooks();
  }, [book._id]);

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
            hasPurchased ? "disabled" : isAdding ? "loading" : ""
          }`}
          onClick={handleAddToCart}
          disabled={isAdding || hasPurchased}
        >
          {hasPurchased
            ? "Bạn đã mua sách này"
            : isAdding
            ? "Đang thêm..."
            : "🛒 Thêm vào giỏ hàng"}
        </button>
      </div>
    </div>
  );
};

export default BookCard;
