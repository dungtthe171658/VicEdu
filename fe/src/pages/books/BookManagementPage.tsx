import { useState, useEffect } from "react";
import bookApi from "../../api/bookApi";
import type { BookDto } from "../../types/book";
import BookForm from "../../components/books/BookForm";
import "./BookManagementPage.css";

const BookManagementPage = () => {
  const [books, setBooks] = useState<BookDto[]>([]);
  const [selectedBook, setSelectedBook] = useState<Partial<BookDto> | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);

  // Load tất cả sách
  const loadBooks = async () => {
    try {
      const res = await bookApi.getAll();
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
      if (selectedBook?._id) {
        // Edit
        await bookApi.update(selectedBook._id, data);
      } else {
        // Add
        await bookApi.create(data);
      }
      setShowModal(false);
      setSelectedBook(null);
      loadBooks();
    } catch (error) {
      console.error("Error saving book:", error);
      alert("Error saving book. Please check your data.");
    }
  };

  // Mở modal để edit
  const handleEdit = (book: BookDto) => {
    setSelectedBook(book);
    setShowModal(true);
  };

  // Mở modal để add
  const handleAdd = () => {
    setSelectedBook(null);
    setShowModal(true);
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

  return (
    <div className="book-management-container">
      <div className="header">
        <h2>Book Management</h2>
        <button className="add-btn" onClick={handleAdd}>
          Add Book
        </button>
      </div>

      <ul className="book-list">
        {books.map((book) => (
          <li key={book._id}>
            <span>{book.title}</span>
            <div className="actions">
              <button className="edit-btn" onClick={() => handleEdit(book)}>
                Edit
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDelete(book._id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedBook ? "Edit Book" : "Add Book"}</h3>
            <BookForm initialData={selectedBook || {}} onSubmit={handleSave} />
            <button className="close-btn" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookManagementPage;
