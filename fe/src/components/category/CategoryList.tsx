// src/pages/Courses/CategoryList.tsx
import {useEffect, useMemo, useState} from "react";
import {Link, useSearchParams} from "react-router-dom";
import {Layers, Star, School, ChevronDown} from "lucide-react";
import categoryApi from "../../api/categoryApi";
import courseApi from "../../api/courseApi";
import type {Category} from "../../types/category";
import type {Course} from "../../types/course";
import {SkeletonBanner} from "./Skeleton";
import {CardImage} from "./CourseCard.tsx";
import {SectionHeader} from "../category/SectionHeader.tsx";

const Placeholder = "https://placehold.co/800x450?text=Banner&font=inter";


function Chip({label, active, onClick}: { label: string; active?: boolean; onClick?: () => void }) {
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


// ===== Page =====
export default function CategoryList() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCat, setActiveCat] = useState<string>("all");
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        (async () => {
            try {
                const [catRes, courseRes] = await Promise.all([
                    categoryApi.getAll(),
                    courseApi.getAll({status: "approved", limit: 24}),
                ]);
                setCategories(catRes || []);
                setCourses((courseRes || []).filter((c: Course) => c.status === "approved"));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // đồng bộ chip lọc với ?cat=
    useEffect(() => {
        const q = searchParams.get("cat");
        if (q) setActiveCat(q);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        if (activeCat === "all") setSearchParams({});
        else setSearchParams({cat: activeCat});
    }, [activeCat, setSearchParams]);

    // tách parent/child theo dữ liệu bạn gửi (parent_id: null hoặc id parent)
    const parents = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
    const childrenByParent = useMemo(() => {
        const map: Record<string, Category[]> = {};
        for (const c of categories) {
            if (c.parent_id) {
                const key = String(c.parent_id);
                map[key] = map[key] || [];
                map[key].push(c);
            }
        }
        return map;
    }, [categories]);

    const filteredCourses = useMemo(() => {
        if (activeCat === "all") return courses;
        const cat = categories.find((c) => c.slug === activeCat || c._id === activeCat);
        if (!cat) return courses;
        return courses.filter((c: Course) => c.category_id === cat._id);
    }, [activeCat, courses, categories]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            {/* ===== Top layout: Sidebar | Main banner | Right banner ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sidebar trái */}
                <aside className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b flex items-center gap-2">
                        <School className="size-5 text-blue-600"/>
                        <h3 className="text-lg font-semibold">Các khóa học</h3>
                    </div>
                    <ul className="py-2 text-gray-700">
                        {loading ? (
                            Array.from({length: 8}).map((_, i) => (
                                <li key={i} className="px-4 py-3">
                                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"/>
                                </li>
                            ))
                        ) : (
                            parents.map((p) => (
                                <li key={p._id} className="">
                                    <Link
                                        to={`/courses/${p.slug}`}
                                        className="flex items-center gap-2 px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition"
                                        onClick={() => setActiveCat(p.slug)}
                                    >
                                        <Layers className="size-4 text-blue-500"/>
                                        <span className="font-medium">{p.name}</span>
                                    </Link>
                                    {childrenByParent[String(p._id)]?.length ? (
                                        <ul className="pl-10 pr-2 pb-2">
                                            {childrenByParent[String(p._id)].map((c) => (
                                                <li key={c._id}>
                                                    <Link
                                                        to={`/courses/${c.slug}`}
                                                        className="flex items-center gap-2 py-2 text-sm text-gray-600 hover:text-blue-600"
                                                        onClick={() => setActiveCat(c.slug)}
                                                    >
                                                        <ChevronDown className="size-4 text-gray-400 -rotate-90"/>
                                                        {c.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </li>
                            ))
                        )}
                    </ul>
                </aside>

                {/* Banner giữa */}
                <section className="lg:col-span-6">
                    {loading ? (
                        <SkeletonBanner/>
                    ) : (
                        <div
                            className="overflow-hidden rounded-2xl shadow-md border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <CardImage src={Placeholder} alt="Banner" className="h-64"/>
                        </div>
                    )}
                </section>

                {/* Banner phụ phải */}
                <aside className="lg:col-span-3 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <img src={Placeholder} alt="right-1" className="w-full h-64 object-cover"/>
                        <div className="p-4 text-center">
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-700 transition">Tải
                                ứng dụng
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Dải thống kê gradient */}
            <section
                className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
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

            {/* Danh mục nổi bật */}
            <section className="mt-10">
                <SectionHeader
                    icon={<Layers className="size-6 text-blue-600"/>}
                    title="Danh mục"
                    subtitle="Học theo lộ trình, chọn lĩnh vực bạn quan tâm"
                    to={parents.length ? `/courses/${parents[0].slug}` : undefined}
                />

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array.from({length: 6}).map((_, i) => (
                            <SkeletonCard key={i}/>
                        ))}
                    </div>
                ) : parents.length === 0 ? (
                    <p className="text-gray-500">Chưa có danh mục nào.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {parents.map((cat) => (
                            <CategoryCard key={cat._id} cat={cat}/>
                        ))}
                    </div>
                )}
            </section>

            {/* Khóa học */}
            <section className="mt-10">
                <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                    <SectionHeader
                        icon={<Star className="size-6 text-emerald-600"/>}
                        title="Khóa học"
                        subtitle={
                            activeCat === "all"
                                ? "Các khóa học đang mở tuyển sinh"
                                : `Khóa học trong danh mục: ${categories.find((c) => c.slug === activeCat)?.name || ""}`
                        }
                    />
                    <div className="ml-auto flex gap-2">
                        <Chip label="Tất cả" active={activeCat === "all"} onClick={() => setActiveCat("all")}/>
                        {parents.slice(0, 6).map((c) => (
                            <Chip
                                key={c._id}
                                label={c.name}
                                active={activeCat === c.slug}
                                onClick={() => setActiveCat(c.slug)}
                            />
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array.from({length: 9}).map((_, i) => (
                            <SkeletonCard key={i}/>
                        ))}
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <p className="text-gray-500">Chưa có khóa học nào.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredCourses.map((c) => (
                            <CourseCard key={c._id} c={c}/>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
