import { useEffect, useState } from "react";
import bookApi from "../../api/bookApi";
import type { BookDto } from "../../types/book";
import BookForm from "../../components/books/BookForm";

const BookManagementPage = () => {
  const [books, setBooks] = useState<BookDto[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookDto | null>(null);

  const loadBooks = () => {
    bookApi.getAll().then((res) => setBooks(res.data));
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleSave = async (data: Partial<BookDto>) => {
    if (selectedBook) {
      await bookApi.update(selectedBook._id, data);
    } else {
      await bookApi.create(data);
    }
    setSelectedBook(null);
    loadBooks();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      await bookApi.delete(id);
      loadBooks();
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-xl font-semibold mb-3">Book List</h2>
        <ul className="space-y-2">
          {books.map((book) => (
            <li
              key={book._id}
              className="flex justify-between items-center border p-2 rounded"
            >
              <span>{book.title}</span>
              <div className="space-x-2">
                <button
                  onClick={() => setSelectedBook(book)}
                  className="px-2 py-1 bg-yellow-500 text-white rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(book._id)}
                  className="px-2 py-1 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">
          {selectedBook ? "Edit Book" : "Add Book"}
        </h2>
        <BookForm initialData={selectedBook || {}} onSubmit={handleSave} />
      </div>
    </div>
  );
};

export default BookManagementPage;
