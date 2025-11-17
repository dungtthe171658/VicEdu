import { useEffect, useState } from "react";
import courseAdminApi from "../../../api/courseAdminApi";
import bookApi from "../../../api/bookApi";
import type { Course } from "../../../types/course";
import type { BookDto } from "../../../types/book.d";

const ITEMS_PER_PAGE = 9;

const formatVND = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

interface DiscountState {
  [key: string]: number; // courseId or bookId -> discount percentage
}

const ManageSaleOffPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [books, setBooks] = useState<BookDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseDiscounts, setCourseDiscounts] = useState<DiscountState>({});
  const [bookDiscounts, setBookDiscounts] = useState<DiscountState>({});
  const [saving, setSaving] = useState<string | null>(null);

  // Load courses and books
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [courseRes, bookRes] = await Promise.all([
          courseAdminApi.getAll(),
          bookApi.getAll(),
        ]);

        const courseData = Array.isArray((courseRes as any).data)
          ? (courseRes as any).data
          : Array.isArray(courseRes)
          ? courseRes
          : [];
        const bookData = Array.isArray((bookRes as any).data)
          ? (bookRes as any).data
          : Array.isArray(bookRes)
          ? bookRes
          : [];

        setCourses(courseData.slice(0, ITEMS_PER_PAGE));
        setBooks(bookData.slice(0, ITEMS_PER_PAGE));
      } catch (error) {
        console.error("Error loading data:", error);
        alert("Không thể tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculate discounted price
  const getDiscountedPrice = (originalPrice: number, discountPercent: number): number => {
    if (!discountPercent || discountPercent <= 0) return originalPrice;
    return Math.round(originalPrice * (1 - discountPercent / 100));
  };

  // Handle course discount change
  const handleCourseDiscountChange = (courseId: string, discount: number) => {
    setCourseDiscounts((prev) => ({
      ...prev,
      [courseId]: Math.max(0, Math.min(100, discount)),
    }));
  };

  // Handle book discount change
  const handleBookDiscountChange = (bookId: string, discount: number) => {
    setBookDiscounts((prev) => ({
      ...prev,
      [bookId]: Math.max(0, Math.min(100, discount)),
    }));
  };

  // Save course discount
  const handleSaveCourseDiscount = async (course: Course) => {
    const discount = courseDiscounts[course._id] || 0;
    const newPrice = getDiscountedPrice(course.price || 0, discount);

    try {
      setSaving(`course-${course._id}`);
      await courseAdminApi.update(course._id, {
        ...course,
        price: newPrice,
        discount_percent: discount > 0 ? discount : undefined,
      } as any);
      alert(`Đã áp dụng giảm giá ${discount}% cho khóa học "${course.title}"`);
    } catch (error) {
      console.error("Error saving course discount:", error);
      alert("Lưu giảm giá thất bại.");
    } finally {
      setSaving(null);
    }
  };

  // Save book discount
  const handleSaveBookDiscount = async (book: BookDto) => {
    const discount = bookDiscounts[book._id] || 0;
    const newPrice = getDiscountedPrice(book.price || 0, discount);

    try {
      setSaving(`book-${book._id}`);
      await bookApi.update(book._id, {
        ...book,
        price: newPrice,
        discount_percent: discount > 0 ? discount : undefined,
      } as any);
      alert(`Đã áp dụng giảm giá ${discount}% cho sách "${book.title}"`);
    } catch (error) {
      console.error("Error saving book discount:", error);
      alert("Lưu giảm giá thất bại.");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Quản lý khuyến mãi</h1>

      {/* Courses Section */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Khóa học (9 khóa học đầu tiên)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const discount = courseDiscounts[course._id] || 0;
            const originalPrice = course.price || 0;
            const discountedPrice = getDiscountedPrice(originalPrice, discount);
            const isSaving = saving === `course-${course._id}`;

            return (
              <div
                key={course._id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
              >
                {/* Course Image */}
                <div className="relative">
                  <img
                    src={course.thumbnail_url || "/assets/vicedu_banner.png"}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  {discount > 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                      -{discount}%
                    </div>
                  )}
                </div>

                {/* Course Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {course.title}
                  </h3>

                  {/* Price Display */}
                  <div className="mb-3">
                    {discount > 0 ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 line-through text-sm">
                            {formatVND(originalPrice)}
                          </span>
                          <span className="text-red-600 font-bold text-lg">
                            {formatVND(discountedPrice)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-800 font-semibold">
                        {formatVND(originalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Discount Input */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giảm giá (%):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={(e) =>
                        handleCourseDiscountChange(
                          course._id,
                          Number(e.target.value) || 0
                        )
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={() => handleSaveCourseDiscount(course)}
                    disabled={isSaving}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isSaving ? "Đang lưu..." : "Áp dụng giảm giá"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Books Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Sách (9 sách đầu tiên)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => {
            const discount = bookDiscounts[book._id] || 0;
            const originalPrice = book.price || 0;
            const discountedPrice = getDiscountedPrice(originalPrice, discount);
            const isSaving = saving === `book-${book._id}`;

            return (
              <div
                key={book._id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
              >
                {/* Book Image */}
                <div className="relative">
                  <img
                    src={book.images?.[0] || "/no-image.png"}
                    alt={book.title}
                    className="w-full h-48 object-cover"
                  />
                  {discount > 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                      -{discount}%
                    </div>
                  )}
                </div>

                {/* Book Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {book.title}
                  </h3>
                  {book.author && (
                    <p className="text-sm text-gray-600 mb-2">
                      Tác giả: {book.author}
                    </p>
                  )}

                  {/* Price Display */}
                  <div className="mb-3">
                    {discount > 0 ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 line-through text-sm">
                            {formatVND(originalPrice)}
                          </span>
                          <span className="text-red-600 font-bold text-lg">
                            {formatVND(discountedPrice)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-800 font-semibold">
                        {formatVND(originalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Discount Input */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giảm giá (%):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={(e) =>
                        handleBookDiscountChange(
                          book._id,
                          Number(e.target.value) || 0
                        )
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={() => handleSaveBookDiscount(book)}
                    disabled={isSaving}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isSaving ? "Đang lưu..." : "Áp dụng giảm giá"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ManageSaleOffPage;

