import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { BookDto } from "../../types/book";
import type { CategoryDto } from "../../types/category";
import categoryApi from "../../api/categoryApi";
import "./BookForm.css";

interface BookFormProps {
  initialData?: Partial<BookDto>;
  onSubmit: (data: Partial<BookDto>) => void;
}

const BookForm = ({ initialData = {}, onSubmit }: BookFormProps) => {
  const [formData, setFormData] = useState<
    Partial<BookDto> & { images?: string[] | string }
  >({
    ...initialData,
    // Khi edit, chuyển category_id về string nếu là object
    category_id:
      typeof initialData.category_id === "object"
        ? initialData.category_id?._id
        : initialData.category_id,
    images: initialData.images || [],
  });
  const [categories, setCategories] = useState<CategoryDto[]>([]);

  useEffect(() => {
    categoryApi.getAll().then((res) => setCategories(res.data));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price_cents" || name === "stock" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Chuyển images sang mảng string
    const imagesArray: string[] =
      typeof formData.images === "string"
        ? formData.images
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s)
        : Array.isArray(formData.images)
        ? formData.images
        : [];

    // Chuẩn payload gửi API
    const payload: Partial<BookDto> = {
      ...formData,
      category_id: formData.category_id?.toString() || "",
      images: imagesArray,
      price_cents: Number(formData.price_cents) || 0,
      stock: Number(formData.stock) || 0,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="book-form">
      <input
        type="text"
        name="title"
        placeholder="Title"
        value={formData.title || ""}
        onChange={handleChange}
        required
      />

      <input
        type="text"
        name="author"
        placeholder="Author"
        value={formData.author || ""}
        onChange={handleChange}
      />

      <textarea
        name="description"
        placeholder="Description"
        value={formData.description || ""}
        onChange={handleChange}
      />

      <input
        type="number"
        name="price_cents"
        placeholder="Price (cents)"
        value={formData.price_cents || ""}
        onChange={handleChange}
        required
      />

      <input
        type="number"
        name="stock"
        placeholder="Stock"
        value={formData.stock || ""}
        onChange={handleChange}
      />

      <select
        name="category_id"
        value={
          typeof formData.category_id === "string"
            ? formData.category_id
            : formData.category_id?._id || ""
        }
        onChange={handleChange}
        required
      >
        <option value="">Select category</option>
        {categories.map((cat) => (
          <option key={cat._id} value={cat._id}>
            {cat.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        name="images"
        placeholder="Images URLs (comma separated)"
        value={
          Array.isArray(formData.images)
            ? formData.images.join(", ")
            : formData.images || ""
        }
        onChange={handleChange}
      />

      <button type="submit">Save</button>
    </form>
  );
};

export default BookForm;
