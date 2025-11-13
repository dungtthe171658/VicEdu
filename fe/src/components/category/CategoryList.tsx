// src/pages/Courses/CategoryList.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layers, Star, School, ChevronDown } from "lucide-react";
import categoryApi from "../../api/categoryApi";
import courseApi from "../../api/courseApi";
import type { Category } from "../../types/category";
import type { Course } from "../../types/course";
import { SkeletonBanner, SkeletonCard } from "../courses/Skeleton";
import { CardImage, CourseCard } from "../courses/CourseCard";
import { SectionHeader } from "./SectionHeader";
import { CategoryCard } from "./CategoryCard";
import BookShowcase from "../books/BookShowcase.tsx";

const Placeholder = "public/assets/vicedu_banner.png";

// Helper: chuẩn hoá mảng trả về từ API
function normalizeList<T = any>(res: any): T[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.result)) return res.result;
  if (Array.isArray(res?.rows)) return res.rows;
  return [];
}

// Helper: ép _id/ObjectId/primitive về string
function toId(val: any): string {
  if (val == null) return "";
  if (typeof val === "object") {
    if (val.$oid) return String(val.$oid);
    if (val._id) return String(val._id);
  }
  return String(val);
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full text-sm border transition",
        active
          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[] | any>([]);
  const [courses, setCourses] = useState<Course[] | any>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        const [catRes, courseRes] = await Promise.all([
          categoryApi.getAll(),
          courseApi.getAll({ limit: 24 }),
        ]);
        setCategories(normalizeList<Category>(catRes));
        setCourses(normalizeList<Course>(courseRes));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Lấy ?cat= từ URL lần đầu
  useEffect(() => {
    const q = searchParams.get("cat");
    if (q) setActiveCat(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đồng bộ activeCat -> URL
  useEffect(() => {
    const current = searchParams.get("cat") ?? "all";
    if (activeCat === "all") {
      if (current !== "all") setSearchParams({});
    } else {
      if (current !== activeCat) setSearchParams({ cat: activeCat });
    }
  }, [activeCat, searchParams, setSearchParams]);

  // Phòng thủ: chỉ làm việc với array
  const catArray: Category[] = Array.isArray(categories) ? categories : [];
  const courseArray: Course[] = Array.isArray(courses) ? courses : [];

  const parents = useMemo(
    () => catArray.filter((c) => c?.parent_id == null),
    [catArray]
  );

  const childrenByParent = useMemo(() => {
    const map: Record<string, Category[]> = {};
    for (const c of catArray) {
      if (c?.parent_id != null) {
        const key = toId(c.parent_id);
        map[key] = map[key] || [];
        map[key].push(c);
      }
    }
    return map;
  }, [catArray]);

  const filteredCourses = useMemo(() => {
    if (!courseArray?.length) return [];

    // ✅ Filter: chỉ hiển thị khóa học đã publish và approved
    let list = courseArray.filter((c: any) => {
      const isPublished = c.is_published === true;
      const isApproved = c.status === 'approved';
      return isPublished && isApproved;
    });

    if (activeCat === "all") {
      return [...list].sort(() => 0.5 - Math.random()).slice(0, 6);
    }

    // tìm category theo slug hoặc _id
    const matchCat =
      catArray.find((c) => c.slug === activeCat) ||
      catArray.find((c) => toId(c._id) === activeCat);

    if (!matchCat) return [];

    const matchId = toId(matchCat._id);

    return list.filter((crs: any) => {
      // check category array (nếu course.category populated)
      if (Array.isArray(crs.category) && crs.category.length > 0) {
        return crs.category.some((c: any) => {
          return toId(c._id || c) === matchId;
        });
      }

      // check category_id (string/object/array)
      const cate = crs.category_id;
      if (!cate) return false;

      if (typeof cate === "string") return toId(cate) === matchId;
      if (typeof cate === "object" && !Array.isArray(cate))
        return toId(cate._id || cate) === matchId;
      if (Array.isArray(cate))
        return cate.some((c) => toId(c._id || c) === matchId);

      return false;
    });
  }, [activeCat, courseArray, catArray]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* ===== Top layout: Sidebar | Main banner | Right banner ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar trái */}
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <School className="size-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Các khóa học</h3>
          </div>

          <ul className="py-2 text-gray-700">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <li key={i} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                  </li>
                ))
              : parents.map((p) => {
                  const isParentActive =
                    activeCat === p.slug || toId(p._id) === activeCat;

                  return (
                    <li key={toId(p._id)}>
                      <Link
                        to={`/courses/${p.slug ?? toId(p._id)}`}
                        onClick={() => setActiveCat(p.slug ?? toId(p._id))}
                        aria-current={isParentActive ? "page" : undefined}
                        className={[
                          "flex items-center gap-2 px-4 py-3 rounded-md transition border-l-2",
                          isParentActive
                            ? "bg-blue-50 text-blue-700 font-semibold border-blue-600"
                            : "hover:bg-blue-50 hover:text-blue-600 border-transparent",
                        ].join(" ")}
                      >
                        <Layers className="size-4 text-blue-500" />
                        <span className="font-medium">{p.name}</span>
                      </Link>

                      {childrenByParent[toId(p._id)]?.length ? (
                        <ul className="pl-10 pr-2 pb-2">
                          {childrenByParent[toId(p._id)].map((c) => {
                            const isChildActive =
                              activeCat === c.slug || toId(c._id) === activeCat;

                            return (
                              <li key={toId(c._id)}>
                                <Link
                                  to={`/courses/${c.slug ?? toId(c._id)}`}
                                  onClick={() =>
                                    setActiveCat(c.slug ?? toId(c._id))
                                  }
                                  aria-current={
                                    isChildActive ? "page" : undefined
                                  }
                                  className={[
                                    "flex items-center gap-2 py-2 text-sm transition",
                                    isChildActive
                                      ? "text-blue-700 font-semibold"
                                      : "text-gray-600 hover:text-blue-600",
                                  ].join(" ")}
                                >
                                  <ChevronDown
                                    className={[
                                      "size-4 -rotate-90",
                                      isChildActive
                                        ? "text-blue-600"
                                        : "text-gray-400",
                                    ].join(" ")}
                                  />
                                  {c.name}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
          </ul>
        </aside>

        {/* Banner giữa */}
        <section className="lg:col-span-9">
          {loading ? (
            <SkeletonBanner />
          ) : (
            <div className="overflow-hidden rounded-2xl shadow-md border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 inline-block">
              <CardImage
                src={Placeholder}
                alt="Vicedu Banner"
                className="w-full h-auto object-cover"
              />
            </div>
          )}
        </section>
      </div>

      {/* Dải thống kê gradient */}
      <section className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold">18 năm</p>
          <p className="text-sm/5 opacity-90">Giáo dục trực tuyến</p>
        </div>
        <div>
          <p className="text-2xl font-bold">7.712.424</p>
          <p className="text-sm/5 opacity-90">Thành viên</p>
        </div>
        <div>
          <p className="text-2xl font-bold">Số 1 Việt Nam</p>
          <p className="text-sm/5 opacity-90">Nền tảng học trực tuyến</p>
        </div>
      </section>

      {/* Khóa học */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <SectionHeader
            icon={<Star className="size-6 text-emerald-600" />}
            title="Khóa học"
            subtitle={
              activeCat === "all"
                ? "Các khóa học đang mở tuyển sinh"
                : `Khóa học trong danh mục: ${
                    catArray.find((c) => c.slug === activeCat)?.name || ""
                  }`
            }
          />
          <div className="ml-auto flex gap-2 flex-wrap">
            <Chip
              label="Tất cả"
              active={activeCat === "all"}
              onClick={() => setActiveCat("all")}
            />
            {parents.slice(0, 6).map((c) => (
              <Chip
                key={toId(c._id)}
                label={c.name}
                active={activeCat === (c.slug ?? toId(c._id))}
                onClick={() => setActiveCat(c.slug ?? toId(c._id))}
              />
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <p className="text-gray-500">Chưa có khóa học nào.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((c) => (
              <CourseCard key={toId((c as any)._id)} c={c} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-16">
        <BookShowcase />
      </section>
    </div>
  );
}
