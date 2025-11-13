import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../hooks/useAuth";
import paymentsApi from "../../api/paymentsApi";
import bookApi from "../../api/bookApi";

const formatVND = (n: number) => n.toLocaleString("vi-VN");

export default function CartPage() {
  const { courses, books, removeCourse, removeBook, clear, updateBookQty } =
    useCart();

  const [payment, setPayment] = useState("vnpay");
  const [loading, setLoading] = useState(false);
  const [inStockBooks, setInStockBooks] = useState(books);
  const [outOfStockBooks, setOutOfStockBooks] = useState<typeof books>([]);
  // Thông tin liên hệ
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const { user } = useAuth();

  // 🔄 Đồng bộ lại stock thật từ DB khi mở trang
  useEffect(() => {
    const syncBookStock = async () => {
      if (!books.length) return;
      try {
        const updatedBooks = await Promise.all(
          books.map(async (b) => {
            try {
              const res = await bookApi.getById(b._id);
              const fresh = res.data;
              if (!fresh) return b;

              return {
                ...b,
                title: fresh.title,
                price_cents: fresh.price_cents,
                stock: fresh.stock,
                images: fresh.images,
              };
            } catch (err) {
              console.error("Không thể load book:", b._id, err);
              return b;
            }
          })
        );

        const inStock = updatedBooks.filter(
          (b) => typeof b.stock === "number" && b.stock > 0
        );
        const outStock = updatedBooks.filter(
          (b) => typeof b.stock === "number" && b.stock <= 0
        );

        setInStockBooks(inStock);
        setOutOfStockBooks(outStock);
        localStorage.setItem("cart_books", JSON.stringify(updatedBooks));
      } catch (err) {
        console.error("Lỗi khi đồng bộ tồn kho:", err);
      }
    };

    syncBookStock();
  }, [books]);

  const handleCheckout = async () => {
    if (courses.length === 0 && inStockBooks.length === 0) {
      alert("Giỏ hàng trống!");
      return;
    }

    try {
      // Validate địa chỉ và số điện thoại trước khi tiến hành
      const trimmedLocation = location.trim();
      const trimmedFullName = fullName.trim();
      const phoneDigits = phone.replace(/\D/g, "");
      if (!trimmedFullName) {
        alert("Vui lòng nhập họ và tên.");
        return;
      }
      if (!trimmedLocation) {
        alert("Vui lòng nhập địa chỉ nhận hàng.");
        return;
      }
      if (!/^\d{9,11}$/.test(phoneDigits)) {
        alert("Số điện thoại không hợp lệ (9-11 số).");
        return;
      }

      setLoading(true);

      // 1️⃣ Kiểm tra stock trước khi thanh toán (không trừ stock ở đây)
      for (const b of inStockBooks) {
        const currentStock = b.stock ?? 0;
        const requestedQty = b.quantity ?? 1;
        if (currentStock < requestedQty) {
          alert(`Sản phẩm ${b.title} không đủ hàng! (Còn lại: ${currentStock} quyển)`);
          setLoading(false);
          return;
        }
      }

      // 2️⃣ Chuẩn bị payload thanh toán
      const items = [
        ...courses.map((c) => ({
          productId: c._id!,
          productType: "Course" as const,
          productName: c.title,
          productPrice: Number(c.price_cents || 0),
          quantity: 1,
        })),
        ...inStockBooks.map((b) => ({
          productId: b._id,
          productType: "Book" as const,
          productName: b.title,
          productPrice: Number(b.price_cents ?? 0),
          quantity: Math.max(1, Number(b.quantity ?? 1)),
          productImage:
            Array.isArray(b.images) && b.images.length > 0
              ? b.images[0]
              : "/no-image.png",
        })),
      ];

      const payload = {
        location: "Hà Nội",
        phone: "0123456789",
        items,
        paymentMethod: payment,
      };
      (payload as any).location = trimmedLocation;
      (payload as any).phone = phoneDigits;
      (payload as any).fullName = trimmedFullName;
      if (user?.email) (payload as any).email = user.email;
      delete (payload as any).paymentMethod;

      // 3️⃣ Gọi API tạo link thanh toán
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

  const handleQtyChange = (bookId: string, value: number, stock: number) => {
    let parsed = Number.isFinite(value)
      ? Math.floor(value)
      : Math.floor(Number(value) || 1);
    if (Number.isNaN(parsed)) parsed = 1;
    const newQty = Math.max(1, Math.min(parsed, stock));
    updateBookQty(bookId, newQty);
  };

  const coursesTotal = courses.reduce(
    (s, c) => s + Number(c.price_cents || 0),
    0
  );
  const booksInStockTotal = inStockBooks.reduce(
    (sum, b) => sum + Number(b.price_cents || 0) * Number(b.quantity || 1),
    0
  );
  const totalPrice = coursesTotal + booksInStockTotal;

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
      {/* === BÊN TRÁI: Danh sách === */}
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
              <div className="col-span-2">
                <p className="font-semibold text-gray-800">{c.title}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Giá: {formatVND(c.price_cents || 0)}đ / khóa
                </p>
              </div>
              <div className="col-span-1"></div>
              <div className="col-span-1 flex items-center justify-between text-right">
                <p className="text-sm text-green-700 font-semibold">
                  {formatVND(c.price_cents || 0)}đ
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

          {/* BOOKS CÒN HÀNG */}
          {inStockBooks.map((b) => {
            const totalBookPrice = (b.price_cents || 0) * (b.quantity || 1);
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
                <div className="col-span-2">
                  <p className="font-semibold text-gray-800">{b.title}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Giá: {formatVND(b.price_cents || 0)}đ / quyển
                  </p>
                  {/* <p className="text-xs text-gray-400 mt-1">
                    Còn lại: {b.stock ?? 0} quyển
                  </p> */}
                </div>
                <div className="col-span-1 flex items-center justify-center gap-2">
                  <button
                    onClick={() =>
                      handleQtyChange(
                        b._id,
                        (b.quantity ?? 1) - 1,
                        b.stock ?? 1
                      )
                    }
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={b.quantity ?? 1}
                    min={1}
                    max={b.stock}
                    onChange={(e) =>
                      handleQtyChange(
                        b._id,
                        parseInt(e.target.value, 10) || 1,
                        b.stock ?? 1
                      )
                    }
                    className="w-12 text-center border rounded appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-moz-appearance]:textfield"
                  />
                  <button
                    onClick={() =>
                      handleQtyChange(
                        b._id,
                        (b.quantity ?? 1) + 1,
                        b.stock ?? 1
                      )
                    }
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
                <div className="col-span-1 flex items-center justify-between text-right">
                  <p className="text-sm text-green-700 font-semibold">
                    {formatVND(totalBookPrice)}đ
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

        {/* === SẢN PHẨM HẾT HÀNG === */}
        {outOfStockBooks.length > 0 && (
          <div className="mt-6 bg-white border border-gray-100 rounded-2xl shadow-sm divide-y">
            <h3 className="text-lg font-semibold text-gray-700 px-4 pt-4">
              📦 Các sản phẩm đang hết
            </h3>
            {outOfStockBooks.map((b) => (
              <div
                key={b._id}
                className="grid grid-cols-5 items-center gap-4 p-4 border-b last:border-b-0 opacity-70"
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
                <div className="col-span-2">
                  <p className="font-semibold text-gray-800">{b.title}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Giá: {formatVND(b.price_cents || 0)}đ / quyển
                  </p>
                  <p className="text-xs text-red-500 mt-1">Hết hàng</p>
                </div>
                <div className="col-span-1 flex items-center justify-center gap-2">
                  <button
                    disabled
                    className="px-2 py-1 bg-gray-200 rounded cursor-not-allowed opacity-50"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={b.quantity ?? 1}
                    disabled
                    className="w-12 text-center border rounded bg-gray-100 text-gray-400"
                  />
                  <button
                    disabled
                    className="px-2 py-1 bg-gray-200 rounded cursor-not-allowed opacity-50"
                  >
                    +
                  </button>
                </div>
                <div className="col-span-1 flex items-center justify-between text-right">
                  <p className="text-sm text-gray-500 font-semibold">
                    {formatVND(b.price_cents || 0)}đ
                  </p>
                  <button
                    onClick={() => removeBook(b._id!)}
                    className="text-red-600 hover:underline text-xs ml-3"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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

      {/* === BÊN PHẢI: Thanh toán === */}
      <aside className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 h-fit sticky top-20">
        <h2 className="text-xl font-semibold mb-4">💳 Hình thức thanh toán</h2>

        {/* Thông tin liên hệ */}
        <div className="mb-6 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ nhận hàng</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ví dụ: 123 Trần Duy Hưng, Cầu Giấy, Hà Nội"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]+"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ví dụ: 0912345678"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {[
            { id: "momo", label: "Momo", icon: "📱", disabled: true },
            {
              id: "vnpay",
              label: "VNPay (PayOS)",
              icon: "🏦",
              disabled: false,
            },
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
