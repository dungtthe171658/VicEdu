import { useEffect, useState } from "react";
import { getBooks, deleteBook, hideBook } from "../api/bookApi";
import { useNavigate } from "react-router-dom";

interface Book {
  _id: string;
  title: string;
  author: string;
  price: number;
  category?: string;
  is_published?: boolean;
}

const BooksPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await getBooks();
      setBooks(data);
    } catch (error) {
      console.error("Lỗi khi tải sách:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem("token") || "";
    if (!confirm("Xác nhận xóa sách này?")) return;
    try {
      await deleteBook(id, token);
      fetchBooks();
    } catch (error) {
      console.error("Lỗi khi xóa sách:", error);
    }
  };

  const handleHide = async (id: string) => {
    const token = localStorage.getItem("token") || "";
    try {
      await hideBook(id, token);
      fetchBooks();
    } catch (error) {
      console.error("Lỗi khi ẩn sách:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">📚 Danh sách Sách</h1>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => navigate("/books/new")}
        >
          + Thêm Sách
        </button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2">Tiêu đề</th>
              <th className="border px-3 py-2">Tác giả</th>
              <th className="border px-3 py-2">Giá</th>
              <th className="border px-3 py-2">Trạng thái</th>
              <th className="border px-3 py-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book._id}>
                <td className="border px-3 py-2">{book.title}</td>
                <td className="border px-3 py-2">{book.author}</td>
                <td className="border px-3 py-2">{book.price}₫</td>
                <td className="border px-3 py-2">
                  {book.is_published ? "Công khai" : "Đã ẩn"}
                </td>
                <td className="border px-3 py-2">
                  <button
                    className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                    onClick={() => navigate(`/books/edit/${book._id}`)}
                  >
                    Sửa
                  </button>
                  <button
                    className="bg-yellow-500 text-white px-3 py-1 rounded mr-2"
                    onClick={() => handleHide(book._id)}
                  >
                    Ẩn
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded"
                    onClick={() => handleDelete(book._id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BooksPage;
