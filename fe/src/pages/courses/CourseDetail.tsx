import {useLocation, useParams, Link} from "react-router-dom";
import {ArrowLeft, Star} from "lucide-react";
import {useEffect, useState} from "react";
import courseApi from "../../api/courseApi";
import type {Course} from "../../types/course";
import {useCart} from "../../contexts/CartContext.tsx";

export default function CourseDetail() {
    const {slug} = useParams();
    const location = useLocation();
    const [course, setCourse] = useState<Course | null>(
        (location.state as any)?.course || null
    );
    const {addCourse, courses, removeCourse} = useCart();

    useEffect(() => {
        if (!course && slug) {
            (async () => {
                try {
                    const data = await courseApi.getBySlug(slug);
                    setCourse(data);
                } catch (err) {
                    console.error(err);
                }
            })();
        }
    }, [slug]);

    if (!course) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"/>
            </div>
        );
    }
    const isInCart = courses.some((c) => c._id === course._id);

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <Link
                to="/courses"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
                <ArrowLeft className="size-4"/> Quay lại
            </Link>

            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
                <img
                    src={course.thumbnail_url || "https://placehold.co/800x450"}
                    alt={course.title}
                    className="w-full h-64 object-cover"
                />
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {course.title}
                    </h1>
                    <div className="flex items-center gap-1 text-amber-500 mb-3">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`size-5 ${i < 4 ? "fill-current" : ""}`}
                            />
                        ))}
                    </div>
                    <p className="text-gray-600 mb-4">{course.description}</p>

                    <p className="text-lg font-semibold text-green-700 mb-6">
                        Giá: {course.price_cents.toLocaleString("vi-VN")}đ
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-4">

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
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
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