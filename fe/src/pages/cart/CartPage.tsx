import { Link } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../hooks/useAuth";
import paymentsApi from "../../api/paymentsApi";

const formatVND = (n: number) => n.toLocaleString("vi-VN");

type PaymentMethod = "momo" | "vnpay" | "cod";

export default function CartPage() {
  const { courses, books, removeCourse, removeBook, clear } = useCart();

  const [payment, setPayment] = useState<PaymentMethod>("vnpay");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleCheckout = async () => {
    if (courses.length === 0 && books.length === 0) {
      alert("Giỏ hàng trống!");
      return;
    }

    try {
      setLoading(true);

      const items = [
        ...courses.map((c) => ({
          productId: c._id!,
          productType: "Course" as const,
          productName: c.title,
          productPrice: Number(c.price || 0),
          quantity: 1,
        })),
        ...books.map((b) => ({
          productId: b._id,
          productType: "Book" as const,
          productName: b.title,
          productPrice: Number(b.price || 0),
          quantity: 1,
          productImage:
            Array.isArray(b.images) && b.images.length > 0
              ? b.images[0]
              : "/no-image.png",
        })),
      ];

      const payload: any = { items, paymentMethod: payment };
      if (user?.email) payload.email = user.email;

      const res: { checkoutUrl?: string } =
        await paymentsApi.createPaymentLink(payload);

      if (res.checkoutUrl) {
        // Không xóa giỏ hàng ở đây - chỉ xóa khi thanh toán thành công
        window.location.href = res.checkoutUrl;
      } else {
        alert("Không nhận được link thanh toán");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      alert(err?.message || "Có lỗi xảy ra khi tạo link thanh toán.");
    } finally {
      setLoading(false);
    }
  };

  const coursesTotal = courses.reduce(
    (sum, c) => sum + Number(c.price || 0),
    0
  );
  const booksTotal = books.reduce(
    (sum, b) => sum + Number(b.price || 0),
    0
  );
  const totalPrice = coursesTotal + booksTotal;

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
      {/* Cột trái: danh sách sản phẩm */}
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold mb-5">Giỏ hàng của bạn</h1>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y">
          {/* COURSES */}
          {courses.map((c) => (
            <div
              key={c._id}
              className="grid grid-cols-5 items-center gap-4 p-4 border-b last:border-b-0"
            >
              <div className="col-span-1 flex justify-center">
                <img
                  src={c.thumbnail_url || "https://placehold.co/100x70"}
                  alt={c.title}
                  className="w-20 h-24 object-cover rounded-md border"
                />
              </div>
              <div className="col-span-3">
                <p className="font-semibold text-gray-800">{c.title}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Giá: {formatVND(c.price || 0)}₫ / khóa
                </p>
              </div>
              <div className="col-span-1 flex items-center justify-between text-right">
                <p className="text-sm text-green-700 font-semibold">
                  {formatVND(c.price || 0)}₫
                </p>
                <button
                  onClick={() => removeCourse(c._id!)}
                  className="text-red-600 hover:underline text-xs ml-3"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}

          {/* BOOKS (ebook) - mỗi sách 1 bản */}
          {books.map((b) => {
            const totalBookPrice = b.price || 0;
            return (
              <div
                key={b._id}
                className="grid grid-cols-5 items-center gap-4 p-4 border-b last:border-b-0"
              >
                <div className="col-span-1 flex justify-center">
                  <img
                    src={
                      Array.isArray(b.images) && b.images.length > 0
                        ? b.images[0]
                        : "/no-image.png"
                    }
                    alt={b.title ?? "Book"}
                    className="w-20 h-24 object-cover rounded-md border"
                  />
                </div>
                <div className="col-span-3">
                  <p className="font-semibold text-gray-800">{b.title}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Giá: {formatVND(b.price || 0)}₫ / ebook
                  </p>
                </div>
                <div className="col-span-1 flex items-center justify-between text-right">
                  <p className="text-sm text-green-700 font-semibold">
                    {formatVND(totalBookPrice)}₫
                  </p>
                  <button
                    onClick={() => removeBook(b._id!)}
                    className="text-red-600 hover:underline text-xs ml-3"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cột phải: hình thức thanh toán */}
      <aside className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 h-fit lg:sticky lg:top-20">
        <h2 className="text-lg font-semibold mb-3">Hình thức thanh toán</h2>
        <div className="space-y-3 mb-6">
          {[
            { id: "momo" as const, label: "Momo", icon: "💜", disabled: true },
            {
              id: "vnpay" as const,
              label: "VNPay (PayOS)",
              icon: "💳",
              disabled: false,
            },
      
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={m.disabled}
              onClick={() => !m.disabled && setPayment(m.id)}
              className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl text-sm ${
                payment === m.id
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-700"
              } ${m.disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{m.icon}</span>
                <span className="font-medium">{m.label}</span>
              </div>
              {payment === m.id && !m.disabled && (
                <span className="text-xs text-blue-600 font-semibold">
                  Đã chọn
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">Tổng tiền thanh toán</span>
          <span className="text-lg font-semibold text-green-700">
            {formatVND(totalPrice)}₫
          </span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full mb-3 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {loading ? "Đang tạo link..." : "Thanh toán ngay"}
        </button>

        <button
          onClick={clear}
          className="w-full border border-gray-300 text-gray-700 py-2 rounded-xl hover:bg-gray-50 transition text-sm"
        >
          Xóa hết giỏ hàng
        </button>
      </aside>
    </div>
  );
}

