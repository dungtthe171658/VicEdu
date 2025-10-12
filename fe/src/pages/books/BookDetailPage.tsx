import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import bookApi from "../../api/bookApi";
import type { BookDto } from "../../types/book.d";

const BookDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<BookDto | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchBook = async () => {
      try {
        const res = await bookApi.getById(id);
        setBook(res.data);
      } catch (error) {
        console.error("Error fetching book:", error);
      }
    };
    fetchBook();
  }, [id]);

  if (!book) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <img
        src={book.images?.[0] || "/no-image.png"}
        alt={book.title}
        className="w-full h-80 object-cover rounded-lg mb-4"
      />
      <h1 className="text-2xl font-bold">{book.title}</h1>
      <p className="text-gray-500">{book.author}</p>
      <p className="mt-4">{book.description}</p>
      <p className="mt-4 font-semibold text-lg text-blue-600">
        ${(book.price_cents / 100).toFixed(2)}
      </p>
    </div>
  );
};

export default BookDetailPage;
