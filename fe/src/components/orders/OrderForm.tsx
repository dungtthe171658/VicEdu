import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { OrderDto, OrderStatus } from "../../types/order";
import type { Course } from "../../types/course";
import type { BookDto } from "../../types/book";
import bookApi from "../../api/bookApi";
import courseApi from "../../api/courseApi";
import "./OrderForm.css";

interface OrderFormProps {
  initialData?: Partial<OrderDto>;
  onSubmit: (data: Partial<OrderDto>) => void;
}

const OrderForm = ({ initialData = {}, onSubmit }: OrderFormProps) => {
  const [formData, setFormData] = useState<Partial<OrderDto>>({
    ...initialData,
    book: initialData.book || [],
    course: initialData.course || [],
  });

  const [books, setBooks] = useState<BookDto[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookRes, courseRes] = await Promise.all([
          bookApi.getAll(),
          courseApi.getAll(),
        ]);
        setBooks(bookRes.data || []);
        setCourses(courseRes.data || []);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "total_amount" ? Number(value) : (value as string | OrderStatus),
    }));
  };

  const handleMultiSelect = (
    e: React.ChangeEvent<HTMLSelectElement>,
    field: "book" | "course"
  ) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setFormData((prev) => ({ ...prev, [field]: selected }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload: Partial<OrderDto> = {
      ...formData,
      total_amount: Number(formData.total_amount) || 0,
      book: formData.book || [],
      course: formData.course || [],
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="order-form">
      <div className="form-group">
        <label htmlFor="user_id">User ID</label>
        <input
          id="user_id"
          name="user_id"
          type="text"
          value={
            typeof formData.user_id === "string"
              ? formData.user_id
              : formData.user_id?._id || ""
          }
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="total_amount">Tổng tiền (VND)</label>
        <input
          id="total_amount"
          name="total_amount"
          type="number"
          value={formData.total_amount ?? ""}
          onChange={handleChange}
          required
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
          <option value="pending">Chờ xử lý</option>
          <option value="completed">Hoàn thành</option>
          <option value="failed">Thất bại</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="payment_method">Phương thức thanh toán</label>
        <select
          id="payment_method"
          name="payment_method"
          value={formData.payment_method || ""}
          onChange={handleChange}
        >
          <option value="">Chọn phương thức</option>
          <option value="payos">PayOS</option>
          <option value="vnpay">VNPay</option>
          <option value="bank">Chuyển khoản</option>
        </select>
      </div>

      <div className="form-group">
        <label>Sách trong đơn hàng</label>
        {loading ? (
          <p>Đang tải sách...</p>
        ) : (
          <select
            multiple
            value={formData.book || []}
            onChange={(e) => handleMultiSelect(e, "book")}
          >
            {books.map((b) => (
              <option key={b._id} value={b._id}>
                {b.title}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="form-group">
        <label>Khóa học trong đơn hàng</label>
        {loading ? (
          <p>Đang tải khóa học...</p>
        ) : (
          <select
            multiple
            value={formData.course.map((c) =>
              typeof c === "string" ? c : c._id
            )}
            onChange={(e) => handleMultiSelect(e, "course")}
          >
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <button type="submit">Lưu đơn hàng</button>
    </form>
  );
};

export default OrderForm;
