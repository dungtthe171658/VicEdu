import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../hooks/useAuth";
import paymentsApi from "../../api/paymentsApi";
import bookApi from "../../api/bookApi";

const formatVND = (n: number) => n.toLocaleString("vi-VN");

export default function CartPage() {
  const { courses, books, removeCourse, removeBook, clear } = useCart();
  const { user } = useAuth();

  const [cartBooks, setCartBooks] = useState(books);
  const [payment, setPayment] = useState("vnpay");
  const [loading, setLoading] = useState(false);

  // Đồng bộ dữ liệu sách từ DB
  useEffect(() => {
    const syncBooks = async () => {
      if (!books.length) return;
      try {
        const updatedBooks = await Promise.all(
          books.map(async (b) => {
            try {
              const res = await bookApi.getById(b._id);
              const fresh = res.data;
              return {
                ...b,
                title: fresh.title,
                price_cents: fresh.price_cents,
                images: fresh.images,
              };
            } catch (err) {
              console.error("Không thể load book:", b._id, err);
              return b;
            }
          })
        );
        setCartBooks(updatedBooks);
        localStorage.setItem("cart_books", JSON.stringify(updatedBooks));
      } catch (err) {
        console.error("Lỗi khi đồng bộ sách:", err);
      }
    };
    syncBooks();
  }, [books]);

  const handleCheckout = async () => {
    if (courses.length === 0 && cartBooks.length === 0) {
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
          productPrice: Number(c.price_cents || 0),
          quantity: 1,
        })),
        ...cartBooks.map((b) => ({
          productId: b._id,
          productType: "Book" as const,
          productName: b.title,
          productPrice: Number(b.price_cents ?? 0),
          quantity: 1, // luôn 1
          productImage:
            Array.isArray(b.images) && b.images.length > 0
              ? b.images[0]
              : "/no-image.png",
        })),
      ];

      const payload: any = { items };
      if (user?.email) payload.email = user.email;

      const res: { checkoutUrl?: string } = await paymentsApi.createPaymentLink(
        payload
      );

      if (res.checkoutUrl) {
        clear();
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
    (s, c) => s + Number(c.price_cents || 0),
    0
  );
  const booksTotal = cartBooks.reduce(
    (sum, b) => sum + Number(b.price_cents || 0),
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
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold mb-5">🛒 Giỏ hàng của bạn</h1>

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
                  Giá: {formatVND(c.price_cents || 0)}đ
                </p>
              </div>
              <div className="col-span-1 flex flex-col items-end justify-center">
                <p className="text-sm text-green-700 font-semibold">
                  {formatVND(c.price_cents || 0)}đ
                </p>
                <button
                  onClick={() => removeCourse(c._id!)}
                  className="text-red-600 hover:underline text-xs mt-1"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}

          {/* BOOKS */}
          {cartBooks.map((b) => (
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
                  Giá: {formatVND(b.price_cents || 0)}đ
                </p>
              </div>
              <div className="col-span-1 flex flex-col items-end justify-center">
                <p className="text-sm text-green-700 font-semibold">
                  {formatVND(b.price_cents || 0)}đ
                </p>
                <button
                  onClick={() => removeBook(b._id!)}
                  className="text-red-600 hover:underline text-xs mt-1"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <p className="text-lg font-semibold">
            Tổng tạm tính:{" "}
            <span className="text-green-700">{formatVND(totalPrice)}đ</span>
          </p>
          <button
            onClick={clear}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Xóa hết
          </button>
        </div>
      </div>

      {/* Thanh toán */}
      <aside className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 h-fit sticky top-20">
        <h2 className="text-xl font-semibold mb-4">💳 Hình thức thanh toán</h2>

        <div className="space-y-3 mb-6">
          {[
            { id: "momo", label: "Momo", icon: "📱", disabled: true },
            { id: "vnpay", label: "VNPay (PayOS)", icon: "🏦", disabled: false },
            { id: "bank", label: "Chuyển khoản", icon: "💸", disabled: true },
          ].map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                payment === opt.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              } ${opt.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                type="radio"
                name="payment"
                value={opt.id}
                checked={payment === opt.id}
                onChange={() => !opt.disabled && setPayment(opt.id)}
                disabled={opt.disabled}
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
            <span className="text-green-700">{formatVND(totalPrice)}đ</span>
          </p>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className={`w-full text-white font-semibold py-3 rounded-lg transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
          </button>
        </div>
      </aside>
    </div>
  );
}
