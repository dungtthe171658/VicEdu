import { useState, useEffect } from "react";
import { createBook, updateBook, getBooks } from "../api/bookApi";
import { useNavigate, useParams } from "react-router-dom";

const BookForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    author: "",
    price: 0,
    category: "",
    description: "",
  });

  const isEdit = Boolean(id);

  useEffect(() => {
    if (isEdit) {
      getBooks().then((data) => {
        const book = data.find((b: any) => b._id === id);
        if (book) setForm(book);
      });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token") || "";

    try {
      if (isEdit) {
        await updateBook(id!, form, token);
        alert("Cập nhật sách thành công!");
      } else {
        await createBook(form, token);
        alert("Thêm sách thành công!");
      }
      navigate("/books");
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {isEdit ? "Chỉnh sửa Sách" : "Thêm Sách Mới"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Tiêu đề"
          className="border p-2 w-full rounded"
          required
        />
        <input
          name="author"
          value={form.author}
          onChange={handleChange}
          placeholder="Tác giả"
          className="border p-2 w-full rounded"
          required
        />
        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="Giá"
          className="border p-2 w-full rounded"
          required
        />
        <input
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder="Thể loại"
          className="border p-2 w-full rounded"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Mô tả"
          className="border p-2 w-full rounded"
        />

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {isEdit ? "Cập nhật" : "Thêm mới"}
        </button>
      </form>
    </div>
  );
};

export default BookForm;
