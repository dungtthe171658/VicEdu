import { useState } from "react";
import type { FormEvent } from "react";
import type { ReviewDto } from "../../types/review";
import "./ReviewForm.css";

interface ReviewFormProps {
  initialData?: Partial<ReviewDto>;
  onSubmit: (data: Partial<ReviewDto>) => void;
}

const ReviewForm = ({ initialData = {}, onSubmit }: ReviewFormProps) => {
  const [formData, setFormData] = useState<Partial<ReviewDto>>({
    ...initialData,
    rating: initialData.rating ?? 5,
    status: initialData.status ?? "pending",
    comment: initialData.comment ?? "",
    product_type: initialData.product_type ?? "Book",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "rating" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="review-form">
      <div className="form-group">
        <label htmlFor="product_type">Loại sản phẩm</label>
        <select
          id="product_type"
          name="product_type"
          value={formData.product_type || "Book"}
          onChange={handleChange}
          required
        >
          <option value="Book">Book</option>
          <option value="Course">Course</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="product_id">ID sản phẩm</label>
        <input
          id="product_id"
          type="text"
          name="product_id"
          value={formData.product_id?.toString() || ""}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="user_id">ID người dùng</label>
        <input
          id="user_id"
          type="text"
          name="user_id"
          value={formData.user_id?.toString() || ""}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="rating">Đánh giá (1–5⭐)</label>
        <input
          id="rating"
          type="number"
          name="rating"
          value={formData.rating ?? 5}
          min={1}
          max={5}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="comment">Nhận xét</label>
        <textarea
          id="comment"
          name="comment"
          value={formData.comment || ""}
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
        </select>
      </div>

      <button type="submit">Lưu đánh giá</button>
    </form>
  );
};

export default ReviewForm;
