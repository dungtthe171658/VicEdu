import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { BookDto } from "../../types/book";
import type { Category } from "../../types/category";
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
    category_id:
      typeof initialData.category_id === "object"
        ? initialData.category_id?._id
        : initialData.category_id || "",
    images: initialData.images || [],
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

 useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getAll();

      // 🔍 Tự động nhận diện mảng danh mục dù API trả kiểu gì
      const list =
        Array.isArray(res) ? res :
        Array.isArray(res?.data) ? res.data :
        Array.isArray(res?.categories) ? res.categories : [];

      setCategories(list);
    } catch (err) {
      console.error("❌ Lỗi khi tải danh mục:", err);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  fetchCategories();
}, []);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price_cents" || name === "stock"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const imagesArray: string[] =
      typeof formData.images === "string"
        ? formData.images
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s)
        : Array.isArray(formData.images)
        ? formData.images
        : [];

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
      <div className="form-group">
        <label htmlFor="title">Tiêu đề</label>
        <input
          id="title"
          type="text"
          name="title"
          value={formData.title || ""}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="author">Tác giả</label>
        <input
          id="author"
          type="text"
          name="author"
          value={formData.author || ""}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Mô tả</label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="price_cents">Giá (VND)</label>
        <input
          id="price_cents"
          type="number"
          name="price_cents"
          value={formData.price_cents ?? ""}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="stock">Số lượng</label>
        <input
          id="stock"
          type="number"
          name="stock"
          value={formData.stock ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="category_id">Danh mục</label>
        <select
          id="category_id"
          name="category_id"
          value={formData.category_id?.toString() || ""}
          onChange={handleChange}
          required
        >
          {loadingCategories ? (
            <option value="">Đang tải danh mục...</option>
          ) : categories.length === 0 ? (
            <option value="">Không có danh mục</option>
          ) : (
            <>
              <option value="">Chọn danh mục</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="images">Images URLs (comma separated)</label>
        <input
          id="images"
          type="text"
          name="images"
          value={
            Array.isArray(formData.images)
              ? formData.images.join(", ")
              : formData.images || ""
          }
          onChange={handleChange}
        />
      </div>

      <button type="submit">Save Book</button>
    </form>
  );
};

export default BookForm;
