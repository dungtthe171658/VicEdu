import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBookById } from "../../api/bookApi";

interface Book {
  _id: string;
  title: string;
  author: string;
  price: number;
  description: string;
}

const BookDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) return;
      try {
        const data = await getBookById(id);
        setBook(data);
      } catch (error) {
        console.error("Error fetching book:", error);
      }
    };
    fetchBook();
  }, [id]);

  if (!book) return <p>Không tìm thấy sách.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>{book.title}</h2>
      <p>Tác giả: {book.author}</p>
      <p>Giá: {book.price.toLocaleString()}₫</p>
      <p>Mô tả: {book.description}</p>
    </div>
  );
};

export default BookDetailPage;
