// src/pages/Courses/CategoryList.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import categoryApi from "../../api/categoryApi";
import courseApi from "../../api/courseApi";
import type {Category} from "../../types/category";
import type {Course} from "../../types/course";

const Placeholder =
    "https://placehold.co/640x360?text=No+Image&font=inter";

function CardImage({ src, alt }: { src?: string; alt: string }) {
    return (
        <img
            src={src || Placeholder}
            alt={alt}
            loading="lazy"
            className="w-full h-40 object-cover rounded-xl"
        />
    );
}

export default function CategoryList() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [catRes, courseRes] = await Promise.all([
                    categoryApi.getAll(),
                    courseApi.getAll({ status: "approved", limit: 9 }),
                ]);
                setCategories(catRes.data || []);
                setCourses((courseRes.data || []).filter((c: Course) => c.status === "approved"));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const rootCategories = useMemo(
        () => categories, // nếu bạn có parent_id, có thể filter(c => !c.parent_id)
        [categories]
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-80">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            {/* Danh mục */}
            <section className="mb-12">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-1.5 h-6 bg-blue-600 rounded" />
                    <h2 className="text-2xl font-bold text-gray-800">Danh mục</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rootCategories.map((cat) => (
                        <Link
                            key={cat._id}
                            to={`/courses/${cat.slug}`}
                            className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition p-4"
                        >
                            <div className="relative">
                                {/* Nếu muốn hiển thị ảnh cho category, bạn có thể thêm field thumbnail_url cho Category sau */}
                                <CardImage alt={cat.name} />
                                <span className="absolute top-2 left-2 text-[11px] font-semibold bg-blue-600 text-white py-1 px-2 rounded">
                  Danh mục
                </span>
                            </div>
                            <div className="mt-3">
                                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600">
                                    {cat.name}
                                </h3>
                                {cat.description && (
                                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                        {cat.description}
                                    </p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Khóa học mới */}
            <section>
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-1.5 h-6 bg-blue-600 rounded" />
                    <h2 className="text-2xl font-bold text-gray-800">Khóa học</h2>
                </div>

                {courses.length === 0 ? (
                    <p className="text-gray-500">Chưa có khóa học nào.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <Link
                                key={course._id}
                                to={`/courses/_/${course.slug}`}
                                className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition p-4"
                            >
                                <div className="relative">
                                    <CardImage src={course.thumbnail_url} alt={course.title} />
                                    <span className="absolute top-2 left-2 text-[11px] font-semibold bg-emerald-600 text-white py-1 px-2 rounded">
                    Khóa học
                  </span>
                                </div>
                                <div className="mt-3">
                                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600">
                                        {course.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                        {course.description}
                                    </p>
                                    <p className="mt-2 font-semibold text-green-700">
                                        {(course.price || 0).toLocaleString("vi-VN")}đ
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
