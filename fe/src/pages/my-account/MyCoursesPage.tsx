import { useEffect, useMemo, useState } from "react";
import axios from "../../api/axios";
import { Link } from "react-router-dom";

type Course = {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  price?: number;
  price_cents?: number;
  thumbnail_url?: string;
};

type EnrollmentPopulated = {
  _id: string;
  course: Course; // nếu backend populate
};

type EnrollmentRaw = {
  _id: string;
  course_id: string; // nếu backend chưa populate
};

export default function MyCoursesPage() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Helper: fetch course by id khi backend không populate
  const fetchCourseById = async (id: string): Promise<Course | null> => {
    try {
      // Gợi ý có endpoint GET /api/courses/:id (nếu chưa có, bạn thêm ở BE)
      const res = await axios.get(`/courses/${id}`);
      return res as Course;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Gợi ý BE: GET /api/enrollments/my (populate sẵn)
        const data = (await axios.get("/enrollments/my")) as any;

        if (Array.isArray(data) && data.length && data[0]?.course) {
          // Trường hợp đã populate
          const list = (data as EnrollmentPopulated[]).map((e) => e.course);
          setCourses(list);
        } else if (Array.isArray(data)) {
          // Chưa populate
          const raw = data as EnrollmentRaw[];
          const fetched: Course[] = [];
          for (const item of raw) {
            if (!item.course_id) continue;
            const c = await fetchCourseById(item.course_id);
            if (c) fetched.push(c);
          }
          setCourses(fetched);
        } else {
          setCourses([]);
        }
      } catch (e: any) {
        setError(e?.message || "Không thể tải danh sách khóa học");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasCourses = useMemo(() => courses.length > 0, [courses]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">Khóa học của tôi</h1>
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Khóa học của tôi</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!hasCourses ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <p className="text-gray-600 mb-4">Bạn chưa có khóa học nào.</p>
          <Link
            to="/courses"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Khám phá khóa học
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
            <div key={c._id} className="bg-white rounded-xl shadow hover:shadow-md transition p-4">
              <img
                src={c.thumbnail_url || "https://placehold.co/600x360"}
                alt={c.title}
                className="w-full h-40 object-cover rounded-lg"
              />
              <div className="mt-3">
                <h3 className="font-semibold text-gray-800 line-clamp-2">{c.title}</h3>
                {c.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{c.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {typeof c.price_cents === "number"
                      ? `${(c.price_cents || 0).toLocaleString("vi-VN")}đ`
                      : c.price
                      ? `${c.price.toLocaleString("vi-VN")}đ`
                      : "Miễn phí"}
                  </div>
                  {c.slug ? (
                    <Link to={`/courses/${c.slug}`} className="text-blue-600 hover:underline text-sm">
                      Vào học
                    </Link>
                  ) : (
                    <span className="text-gray-400 text-sm">Không có slug</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
