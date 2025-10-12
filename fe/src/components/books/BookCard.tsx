import type { BookDto } from "../../types/book.d";
import { Link } from "react-router-dom";

interface BookCardProps {
  book: BookDto;
}

const BookCard = ({ book }: BookCardProps) => {
  const price = (book.price_cents / 100).toFixed(2);

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Ảnh sách */}
      <div className="relative">
        <img
          src={book.images?.[0] || "/no-image.png"}
          alt={book.title}
          className="w-full h-56 object-cover"
        />
        <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full shadow">
          ${price}
        </div>
      </div>

      {/* Nội dung */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
          {book.title}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{book.author}</p>

        <Link
          to={`/books/${book._id}`}
          className="inline-block mt-4 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          Xem chi tiết →
        </Link>
      </div>
    </div>
  );
};

export default BookCard;
