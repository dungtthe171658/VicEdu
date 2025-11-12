import React, { useState } from "react";
import BookListPage from "./BookListPage";
import BookForm from "../../components/books/BookForm";
import { BookDto } from "../../types/book.d";
import bookApi from "../../api/bookApi";

const BooksPage: React.FC = () => {
  const [selectedBook, setSelectedBook] = useState<BookDto | null>(null);

  const handleSave = async (data: Partial<BookDto>) => {
    if (selectedBook) {
      await bookApi.update(selectedBook._id, data);
    } else {
      await bookApi.create(data);
    }
    setSelectedBook(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* 📚 Danh sách sách */}
        <div className="md:col-span-2">
          <BookListPage />
        </div>

        {/* 🧾 Form thêm/sửa */}
        <div className="md:col-span-1">
          <div className="sticky top-20">
            <h5 className="mb-3 font-semibold">Thêm / Sửa Sách</h5>
            <div className="p-4 bg-white rounded shadow-sm">
              <BookForm initialData={selectedBook || {}} onSubmit={handleSave} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BooksPage;
