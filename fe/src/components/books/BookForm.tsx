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

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET!;

const BookForm = ({ initialData = {}, onSubmit }: BookFormProps) => {
  const [formData, setFormData] = useState<
    Partial<BookDto> & { images?: string[] }
  >({
    ...initialData,
    category_id:
      typeof initialData.category_id === "object"
        ? initialData.category_id?._id
        : initialData.category_id || "",
    images: Array.isArray(initialData.images) ? initialData.images : [],
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Load danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryApi.getAll();
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.categories)
          ? res.categories
          : [];
        setCategories(list);
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formDataCloud = new FormData();
    formDataCloud.append("file", file);
    formDataCloud.append("upload_preset", UPLOAD_PRESET);

    console.log("🌩 Uploading:", {
      file,
      CLOUD_NAME,
      UPLOAD_PRESET,
    });

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formDataCloud,
        }
      );

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Không thể parse JSON từ Cloudinary");
      }

      if (!res.ok) {
        throw new Error(
          data.error?.message || "Upload thất bại (Cloudinary error)"
        );
      }

      if (!data.secure_url) {
        throw new Error("Upload thất bại: Không có secure_url trong response");
      }

      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), data.secure_url],
      }));

      console.log("Ảnh đã upload thành công");
    } catch (err) {
      console.error("Lỗi upload ảnh:", err);
      alert(`Upload ảnh thất bại: ${err instanceof Error ? err.message : err}`);
    } finally {
      setUploading(false);
    }
  };

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
    const payload: Partial<BookDto> = {
      ...formData,
      category_id: formData.category_id?.toString() || "",
      price_cents: Number(formData.price_cents) || 0,
      stock: Number(formData.stock) || 0,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="book-form">
      {/* Tiêu đề */}
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

      {/* Tác giả */}
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

      {/* Mô tả */}
      <div className="form-group">
        <label htmlFor="description">Mô tả</label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
        />
      </div>

      {/* Giá */}
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

      {/* Số lượng */}
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

      {/* Danh mục */}
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

      {/* Upload ảnh */}
      <div className="form-group">
        <label>Ảnh bìa</label>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {uploading && <p>Đang tải ảnh lên Cloudinary...</p>}

        <div className="preview-container">
          {formData.images?.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Preview ${idx + 1}`}
              style={{ width: "100px", marginRight: "8px" }}
            />
          ))}
        </div>
      </div>

      <button type="submit" className="btn-save">
        Lưu sách
      </button>
    </form>
  );
};

export default BookForm;
