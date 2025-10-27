import { useLocation, useParams, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Star } from "lucide-react";
import { useEffect, useState } from "react";
import courseApi from "../../api/courseApi";
import type { Course } from "../../types/course";
import { useCart } from "../../contexts/CartContext";

export default function CourseDetail() {
  const { slug } = useParams();
  const location = useLocation();

  const [course, setCourse] = useState<Course | null>(
    (location.state as any)?.course || null
  );

  const { addCourse, courses, removeCourse } = useCart();

  useEffect(() => {
    (async () => {
      try {
        // Nếu chưa có course (vào trực tiếp /courses/:slug)
        if (!course && slug) {
          const data = await courseApi.getBySlug(slug);
          setCourse(data);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu khóa học:", err);
      }
    })();
  }, [slug]);

  if (!course) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const isInCart = courses.some((c) => c._id === course._id);
  const formatVND = (n: number) => n.toLocaleString("vi-VN");

  // Danh mục
  const categoryName =
    Array.isArray(course.category) && course.category.length > 0
      ? course.category[0].name || "Chưa có danh mục"
      : "Chưa có danh mục";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Quay lại */}
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </Link>

      {/* Thông tin khóa học */}
      <div className="bg-white shadow border border-gray-100 rounded-2xl overflow-hidden">
        <img
          src={course.thumbnail_url || "https://placehold.co/800x400"}
          alt={course.title}
          className="w-full h-64 object-cover"
        />

        <div className="p-6">
          {/* Tiêu đề */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {course.title}
          </h1>

          {/* Giảng viên */}
          <p className="text-sm md:text-base font-semibold text-blue-500 mb-2">
            Giảng viên:{" "}
            <span className="text-gray-700">
              {course.teacherNames && course.teacherNames.length > 0
                ? course.teacherNames.join(", ")
                : "Admin"}
            </span>
          </p>

          {/* Nếu muốn hiển thị avatar giáo viên, có thể thêm: */}
          {course.teacher && course.teacher.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              {course.teacher.map((t) => (
                <div key={t.full_name} className="flex items-center gap-1">
                  <img
                    src={t.avatar_url}
                    alt={t.full_name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-gray-700">{t.full_name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Danh mục */}
          <p className="text-sm md:text-base font-semibold text-blue-500 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            {categoryName}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 text-amber-500 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${i < 4 ? "fill-current" : ""}`}
              />
            ))}
          </div>

          {/* Mô tả chi tiết */}
          <p className="text-gray-700 mb-6 leading-relaxed">
            {course.description || "Không có mô tả chi tiết."}
          </p>

          {/* Giá */}
          <p className="text-2xl font-semibold text-green-700 mb-6">
            {formatVND(course.price_cents || 0)}₫
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-8">
            {isInCart ? (
              <>
                <Link
                  to="/cart"
                  className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-lg font-semibold border border-gray-300 hover:bg-gray-200 transition"
                >
                  Đã trong giỏ hàng
                </Link>
                <button
                  onClick={() => removeCourse(course._id)}
                  className="bg-red-100 text-red-600 px-4 py-2.5 rounded-lg font-semibold border border-red-300 hover:bg-red-200 transition"
                >
                  Xóa khỏi giỏ
                </button>
              </>
            ) : (
              <button
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
                onClick={() => addCourse(course)}
              >
                Đăng ký học ngay
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
