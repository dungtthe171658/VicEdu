import { Link } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useCart } from "../../contexts/CartContext";

const formatVND = (n: number) => n.toLocaleString("vi-VN");

export default function CartPage() {
    const { courses, books, removeCourse, removeBook, clear, total } = useCart();
    const [payment, setPayment] = useState("momo"); // default momo

    const handleCheckout = async () => {
        if (courses.length === 0 && books.length === 0) {
            alert("Giỏ hàng trống!");
            return;
        }

        try {
            const payload = {
                course: courses.map((c) => c._id),
                book: books,
                payment_method: payment,
            };

            // Giả lập gọi API
            const res = await axios.post("/api/orders", payload);
            console.log("Order:", res.data);

            clear();
            alert("✅ Đặt hàng thành công!");
        } catch (err) {
            console.error(err);
            alert("Có lỗi xảy ra khi thanh toán.");
        }
    };

    if (courses.length === 0 && books.length === 0) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-16 text-center">
                <p className="text-gray-600 mb-4">Giỏ hàng của bạn đang trống.</p>
                <Link
                    to="/courses"
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                    Xem khóa học
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* === BÊN TRÁI: Danh sách khóa học === */}
            <div className="lg:col-span-2">
                <h1 className="text-2xl font-bold mb-5">🛒 Giỏ hàng của bạn</h1>

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y">
                    {courses.map((c) => (
                        <div key={c._id} className="flex justify-between items-center p-4">
                            <div className="flex items-center gap-3">
                                <img
                                    src={c.thumbnail_url || "https://placehold.co/100x70"}
                                    alt={c.title}
                                    className="w-24 h-16 object-cover rounded"
                                />
                                <div>
                                    <p className="font-semibold text-gray-800">{c.title}</p>
                                    <p className="text-sm text-gray-500">
                                        {formatVND(c.price_cents || 0)}đ
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => removeCourse(c._id!)}
                                className="text-red-600 hover:underline text-sm"
                            >
                                Xóa
                            </button>
                        </div>
                    ))}

                    {books.map((b) => (
                        <div key={b} className="flex justify-between items-center p-4">
                            <p className="text-gray-800">📘 Sách #{b}</p>
                            <button
                                onClick={() => removeBook(b)}
                                className="text-red-600 hover:underline text-sm"
                            >
                                Xóa
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-between items-center">
                    <p className="text-lg font-semibold">
                        Tổng tạm tính:{" "}
                        <span className="text-green-700">{formatVND(total)}đ</span>
                    </p>
                    <button
                        onClick={clear}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                        Xóa hết
                    </button>
                </div>
            </div>

            {/* === BÊN PHẢI: Thanh toán === */}
            <aside className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 h-fit sticky top-20">
                <h2 className="text-xl font-semibold mb-4">💳 Hình thức thanh toán</h2>

                <div className="space-y-3 mb-6">
                    {[
                        { id: "momo", label: "Momo", icon: "📱" },
                        { id: "vnpay", label: "VNPay", icon: "🏦" },
                        { id: "bank", label: "Chuyển khoản", icon: "💸" },
                    ].map((opt) => (
                        <label
                            key={opt.id}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                                payment === opt.id
                                    ? "border-blue-600 bg-blue-50"
                                    : "border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                            <input
                                type="radio"
                                name="payment"
                                value={opt.id}
                                checked={payment === opt.id}
                                onChange={() => setPayment(opt.id)}
                                className="text-blue-600 focus:ring-blue-600"
                            />
                            <span className="text-gray-800 font-medium flex items-center gap-2">
                {opt.icon} {opt.label}
              </span>
                        </label>
                    ))}
                </div>

                <div className="border-t pt-4">
                    <p className="text-lg font-semibold mb-2">
                        Tổng thanh toán:{" "}
                        <span className="text-green-700">{formatVND(total)}đ</span>
                    </p>
                    <button
                        onClick={handleCheckout}
                        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
                    >
                        Xác nhận thanh toán
                    </button>
                </div>
            </aside>
        </div>
    );
}
