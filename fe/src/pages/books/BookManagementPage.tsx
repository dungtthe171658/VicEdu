import { useState, useEffect } from "react";
import bookApi from "../../api/bookApi";
import type { BookDto } from "../../types/book";
import BookForm from "../../components/books/BookForm";
import BookModal from "../../components/books/BookModal";
import "./BookManagementPage.css";

const BookManagementPage = () => {
  const [books, setBooks] = useState<BookDto[]>([]);
  const [selectedBook, setSelectedBook] = useState<Partial<BookDto> | null>(
    null
  );
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailBook, setDetailBook] = useState<BookDto | null>(null);

  // Load tất cả sách
  const loadBooks = async () => {
    try {
      const res = await bookApi.getAll();
      console.log("Books loaded:", res.data);
      setBooks(res.data);
    } catch (error) {
      console.error("Error loading books:", error);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  // Thêm hoặc sửa sách
  const handleSave = async (data: Partial<BookDto>) => {
    try {
      console.log("Submitting payload to backend:", data);
      if (selectedBook?._id) {
        const res = await bookApi.update(selectedBook._id, data);
        console.log("Book updated:", res.data);
      } else {
        const res = await bookApi.create(data);
        console.log("Book created:", res.data);
      }
      setShowFormModal(false);
      setSelectedBook(null);
      loadBooks();
    } catch (error) {
      console.error("Error saving book:", error);
      alert("Error saving book. Please check your data.");
    }
  };

  // Mở modal để edit (fetch chi tiết để prefill)
  const handleEdit = async (book: BookDto) => {
    try {
      const res = await bookApi.getById(book._id);
      console.log("Fetched for edit:", res.data);
      setSelectedBook(res.data);
      setShowFormModal(true);
    } catch (err) {
      console.error("Error fetching book details for edit:", err);
      alert("Cannot fetch book details.");
    }
  };

  // Mở modal để add
  const handleAdd = () => {
    setSelectedBook(null);
    setShowFormModal(true);
  };

  // Xóa sách
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this book?")) {
      try {
        await bookApi.delete(id);
        loadBooks();
      } catch (error) {
        console.error("Error deleting book:", error);
        alert("Cannot delete book. Please try again.");
      }
    }
  };

  // Mở popup chi tiết sách (fetch chi tiết để có pdf_url)
  const handleDetail = async (book: BookDto) => {
    try {
      const res = await bookApi.getById(book._id);
      console.log("Detail book fetched:", res.data);
      setDetailBook(res.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error("Error fetching book details:", err);
      alert("Cannot fetch book details.");
    }
  };

  return (
    <div className="book-management-container">
      <div className="header">
        <h2>Quản Lý Sách</h2>
        <button className="add-btn" onClick={handleAdd}>
          Thêm Sách
        </button>
      </div>

      <ul className="book-list">
        {books.map((book) => (
          <li key={book._id}>
            <span>{book.title}</span>
            <div className="actions">
              <button className="edit-btn" onClick={() => handleEdit(book)}>
                Sửa
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDelete(book._id)}
              >
                Xóa
              </button>
              <button
                className="details-btn"
                onClick={() => handleDetail(book)}
              >
                Chi tiết
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal thêm/sửa sách */}
      {showFormModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedBook ? "Edit Book" : "Add Book"}</h3>
            <BookForm initialData={selectedBook || {}} onSubmit={handleSave} />
            <button
              className="close-btn"
              onClick={() => setShowFormModal(false)}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Modal hiển thị chi tiết sách */}
      {detailBook && (
        <BookModal
          book={detailBook}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
};

export default BookManagementPage;
