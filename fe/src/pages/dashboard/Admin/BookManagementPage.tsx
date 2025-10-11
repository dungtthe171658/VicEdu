import { useEffect, useState } from "react";
import { getBooks, createBook, updateBook, deleteBook } from "../../../api/bookApi";

interface Book {
  _id?: string;
  title: string;
  author: string;
  price: number;
}

const BookManagementPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [form, setForm] = useState<Book>({ title: "", author: "", price: 0 });

  const fetchBooks = async () => {
    const data = await getBooks();
    setBooks(data);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form._id) {
      await updateBook(form._id, form);
    } else {
      await createBook(form);
    }
    setForm({ title: "", author: "", price: 0 });
    fetchBooks();
  };

  const handleEdit = (book: Book) => {
    setForm(book);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    await deleteBook(id);
    fetchBooks();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Quản lý sách</h2>

      {/* Form thêm/sửa */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          name="title"
          placeholder="Tên sách"
          value={form.title}
          onChange={handleChange}
          required
        />
        <input
          name="author"
          placeholder="Tác giả"
          value={form.author}
          onChange={handleChange}
          required
        />
        <input
          name="price"
          type="number"
          placeholder="Giá"
          value={form.price}
          onChange={handleChange}
          required
        />
        <button type="submit">{form._id ? "Cập nhật" : "Thêm"}</button>
      </form>

      {/* Danh sách */}
      <table border={1} cellPadding={8} style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Tên sách</th>
            <th>Tác giả</th>
            <th>Giá</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book._id}>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>{book.price.toLocaleString()}₫</td>
              <td>
                <button onClick={() => handleEdit(book)}>Sửa</button>
                <button onClick={() => handleDelete(book._id)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BookManagementPage;
