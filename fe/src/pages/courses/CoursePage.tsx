import { useEffect, useState, useMemo } from "react";
import courseApi from "../../api/courseApi";
import categoryApi from "../../api/categoryApi";
import type { Course } from "../../types/course";
import type { Category } from "../../types/category";
import { CourseCard } from "../../components/courses/CourseCard";
import { SkeletonCard } from "../../components/courses/Skeleton";
import enrollmentApi from "../../api/enrollmentApi";

function normalizeList<T = any>(res: any): T[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.result)) return res.result;
  if (Array.isArray(res?.rows)) return res.rows;
  return [];
}

function toId(val: any): string {
  if (val == null) return "";
  if (typeof val === "object") {
    if (val.$oid) return String(val.$oid);
    if (val._id) return String(val._id);
  }
  return String(val);
}

const formatVND = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

export const CoursePage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceLimit, setPriceLimit] = useState<number>(500000);
  const [sortBy, setSortBy] = useState<string>("none");

  // Fetch data
  useEffect(() => {
    (async () => {
      try {
        const [courseRes, categoryRes, myEnrollIds] = await Promise.all([
          courseApi.getAll(),
          categoryApi.getAll(),
          enrollmentApi.getMyEnrolledCourseIds().catch(() => new Set<string>()),
        ]);
        setCourses(normalizeList<Course>(courseRes));
        setCategories(normalizeList<Category>(categoryRes));
        if (myEnrollIds instanceof Set) setEnrolledIds(myEnrollIds);
      } catch (err) {
        console.error("Failed to load courses or categories:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Lọc + sắp xếp
  const filteredCourses = useMemo(() => {
    let list = [...courses];

    // ✅ Filter: chỉ hiển thị khóa học đã publish
    list = list.filter((c) => {
      return (c as any).is_published === true;
    });

    // ✅ Filter by category
    if (selectedCategory !== "all") {
      list = list.filter((c) => {
        if (Array.isArray(c.category)) {
          return c.category.some(
            (cat: any) => toId(cat._id) === selectedCategory
          );
        }
        if (c.category_id) {
          return toId(c.category_id) === selectedCategory;
        }
        return false;
      });
    }

    // Filter by price range
    list = list.filter((c) => (c.price_cents || 0) <= priceLimit);

    // Sort by price
    if (sortBy === "asc")
      list.sort((a, b) => (a.price_cents || 0) - (b.price_cents || 0));
    if (sortBy === "desc")
      list.sort((a, b) => (b.price_cents || 0) - (a.price_cents || 0));

    return list;
  }, [courses, selectedCategory, priceLimit, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar filter */}
      <aside className="lg:col-span-1 border border-gray-200 rounded-xl p-5 bg-white h-fit">
        <h2 className="text-lg font-semibold mb-4">Bộ lọc</h2>

        {/* Category filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Danh mục
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring focus:ring-blue-100"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((cate) => (
              <option key={toId(cate._id)} value={toId(cate._id)}>
                {cate.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price range filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Giá tối đa:{" "}
            <span className="text-blue-600 font-semibold">
              {formatVND(priceLimit)}
            </span>
          </label>
          <input
            type="range"
            min={10000}
            max={500000}
            step={10000}
            value={priceLimit}
            onChange={(e) => setPriceLimit(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10.000đ</span>
            <span>500.000đ</span>
          </div>
        </div>

        {/* Sort */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Sắp xếp theo
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring focus:ring-blue-100"
          >
            <option value="none">Mặc định</option>
            <option value="asc">Giá tăng dần</option>
            <option value="desc">Giá giảm dần</option>
          </select>
        </div>
      </aside>

      {/* Course list */}
      <main className="lg:col-span-3">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <p className="text-gray-500 mt-4">Không tìm thấy khóa học phù hợp.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((c) => (
              <CourseCard key={toId(c._id)} c={c} isEnrolled={enrolledIds.has(toId((c as any)._id))} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
