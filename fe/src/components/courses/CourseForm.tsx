import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { Course } from "../../types/course";
import type { Category } from "../../types/category";
import categoryApi from "../../api/categoryApi";
import "./CourseForm.css"; 

interface CourseFormProps {
  initialData?: Partial<Course>;
  onSubmit: (data: Partial<Course>) => void;
}

const CourseForm = ({ initialData = {}, onSubmit }: CourseFormProps) => {
  const [formData, setFormData] = useState<Partial<Course>>({
    ...initialData,
    category_id:
      typeof initialData.category_id === "object"
        ? initialData.category_id?._id
        : initialData.category_id || "",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data: Category[] = await categoryApi.getAll(); // trả về array
        setCategories(data || []);
      } catch {
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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "price_cents"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const payload: Partial<Course> = {
      ...formData,
      category_id: formData.category_id?.toString() || "",
      price_cents: Number(formData.price_cents) || 0,
      is_published: !!formData.is_published,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="book-form">
      <div className="form-group">
        <label htmlFor="title">Tên khóa học</label>
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
        <label htmlFor="description">Mô tả</label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          rows={3}
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
        <label htmlFor="thumbnail_url">Ảnh Thumbnail (URL)</label>
        <input
          id="thumbnail_url"
          type="text"
          name="thumbnail_url"
          value={formData.thumbnail_url || ""}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="status">Trạng thái</label>
        <select
          id="status"
          name="status"
          value={formData.status || "pending"}
          onChange={handleChange}
        >
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Từ chối</option>
        </select>
      </div>

      <div className="form-group checkbox">
        <label>
          <input
            type="checkbox"
            name="is_published"
            checked={!!formData.is_published}
            onChange={handleChange}
          />
          Xuất bản khóa học
        </label>
      </div>

      <button type="submit">Lưu khóa học</button>
    </form>
  );
};

export default CourseForm;
