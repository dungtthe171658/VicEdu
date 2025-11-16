import { useEffect, useMemo, useState } from "react";
import axios from "../../api/axios";
import enrollmentApi from "../../api/enrollmentApi";
import { Link } from "react-router-dom";

type Course = {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  price?: number;
  price?: number;
  thumbnail_url?: string;
  lessons?: string[];
};

type CourseWithProgress = Course & {
  progress: number;
  totalLessons: number;
  completedLessons: number;
  remainingLessons: number;
};

type EnrollmentPopulated = {
  _id: string;
  course: Course; // nếu backend populate
};

type EnrollmentRaw = {
  _id: string;
  course_id: string; // nếu backend chưa populate
};

// Circular Progress Component
function CircularProgress({ 
  percentage, 
  remainingLessons 
}: { 
  percentage: number; 
  remainingLessons: number;
}) {
  const size = 60;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative group">
      <div className="bg-white rounded-full p-1 shadow-md relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* White background circle inside */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius - strokeWidth / 2}
            fill="white"
          />
          {/* Background circle (gray ring) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#3b82f6"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs font-semibold text-black">{Math.round(percentage)}%</span>
        </div>
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {remainingLessons > 0 
          ? `Còn ${remainingLessons} bài học cần hoàn thành`
          : "Đã hoàn thành"}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
          <div className="border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
}

export default function MyCoursesPage() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Helper: fetch course by id khi backend không populate
  const fetchCourseById = async (id: string): Promise<Course | null> => {
    try {
      // Gợi ý có endpoint GET /api/courses/:id (nếu chưa có, bạn thêm ở BE)
      const res = await axios.get(`/courses/id/${id}`);
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
        console.log("[MyCourses] fetching /enrollments/my-mini", {
          baseURL: (axios as any).defaults?.baseURL,
          hasToken: !!localStorage.getItem("accessToken"),
        });
                const params: any = {};
        const testEmail = (import.meta as any).env?.VITE_ENROLL_TEST_EMAIL;
        if (testEmail) params.email = String(testEmail);
        if ((import.meta as any).env?.DEV) params.includePending = 1;

        const data = (await enrollmentApi.getMyEnrollMini(params)) as any;
        console.log("[MyCourses] /enrollments/my-mini response:", data);

        let courseList: Course[] = [];
        
        if (Array.isArray(data) && data.length && data[0]?.course) {
          // Trường hợp đã populate
          const list = (data as EnrollmentPopulated[]).map((e) => e.course);
          // ✅ Filter: chỉ hiển thị khóa học đã publish
          courseList = list.filter((c: any) => {
            return c.is_published === true;
          });
        } else if (Array.isArray(data)) {
          // Chưa populate
          const raw = data as EnrollmentRaw[];
          const fetched: Course[] = [];
          for (const item of raw) {
            if (!item.course_id) continue;
            console.log("[MyCourses] fetching course by id:", item.course_id);
            const c = await fetchCourseById(item.course_id);
            console.log("[MyCourses] fetched course id:", c?._id);
            if (c) {
              // ✅ Filter: chỉ hiển thị khóa học đã publish
              if ((c as any).is_published === true) {
                fetched.push(c);
              }
            }
          }
          console.log("[MyCourses] total fetched courses:", fetched.length);
          courseList = fetched;
        } else {
          console.log("[MyCourses] response is not array, setting empty list");
          courseList = [];
        }

        // Fetch enrollment progress for each course
        const coursesWithProgress: CourseWithProgress[] = await Promise.all(
          courseList.map(async (course) => {
            try {
              const enrollment = await enrollmentApi.getEnrollmentByCourse(course._id);
              const totalLessons = Array.isArray(course.lessons) ? course.lessons.length : 0;
              const completedLessons = Array.isArray(enrollment.completed_lessons) 
                ? enrollment.completed_lessons.length 
                : 0;
              const remainingLessons = Math.max(0, totalLessons - completedLessons);
              const progress = enrollment.progress || 0;

              return {
                ...course,
                progress,
                totalLessons,
                completedLessons,
                remainingLessons,
              };
            } catch (err) {
              console.warn(`[MyCourses] Could not fetch enrollment for course ${course._id}:`, err);
              // Default values if enrollment fetch fails
              const totalLessons = Array.isArray(course.lessons) ? course.lessons.length : 0;
              return {
                ...course,
                progress: 0,
                totalLessons,
                completedLessons: 0,
                remainingLessons: totalLessons,
              };
            }
          })
        );

        setCourses(coursesWithProgress);
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
              <div className="relative">
                <img
                  src={c.thumbnail_url || "https://placehold.co/600x360"}
                  alt={c.title}
                  className="w-full h-40 object-cover rounded-lg"
                />
                {/* Circular Progress Indicator */}
                <div className="absolute top-2 right-2">
                  <CircularProgress 
                    percentage={c.progress} 
                    remainingLessons={c.remainingLessons}
                  />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="font-semibold text-gray-800 line-clamp-2">{c.title}</h3>
                {c.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{c.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {typeof c.price === "number"
                      ? `${(c.price || 0).toLocaleString("vi-VN")}đ`
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


