import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../hooks/useAuth";
import paymentsApi from "../../api/paymentsApi";
import bookApi from "../../api/bookApi";
import voucherApi, {type ApplyVoucherResponse} from "@/api/voucherApi.ts";

const formatVND = (n: number) => n.toLocaleString("vi-VN");

type PaymentMethod = "momo" | "vnpay" | "cod";

type VoucherAppliedData = {
  discount: number;
  finalTotal: number;
  subtotal: number;
  voucher: {
    code: string;
    type: "amount" | "percent";
    value: number;
    applyTo: "book" | "course" | "both";
  };
};

export default function CartPage() {
  const { courses, books, removeCourse, removeBook, clear } = useCart();

  const [payment, setPayment] = useState<PaymentMethod>("vnpay");
  const [loading, setLoading] = useState(false);
  const [purchasedBookIds, setPurchasedBookIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  // ====== VOUCHER STATE ======
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherApplying, setVoucherApplying] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherResult, setVoucherResult] = useState<VoucherAppliedData | null>(null);

  // khi giỏ hàng thay đổi thì clear voucher (tránh lệch số tiền)
  useEffect(() => {
    setVoucherResult(null);
    setVoucherError(null);
  }, [courses, books]);

  // Fetch purchased books
  useEffect(() => {
    const fetchPurchasedBooks = async () => {
      try {
        const res = await bookApi.getBookOrderAndOrderitem();
        const payload = (res as any)?.data;
        const list: any[] = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
                ? payload.data
                : [];
        const ids = list.map((b) => String(b._id || b));
        setPurchasedBookIds(new Set(ids));
      } catch (err) {
        console.error("Không thể tải sách đã mua:", err);
        setPurchasedBookIds(new Set());
      }
    };

    if (user) {
      fetchPurchasedBooks();
    }
  }, [user]);

  // Filter out purchased books from checkout
  const availableBooks = books.filter((b) => !purchasedBookIds.has(b._id));
  const purchasedBooksInCart = books.filter((b) => purchasedBookIds.has(b._id));

  const coursesTotal = courses.reduce(
      (sum, c) => sum + Number(c.price || 0),
      0
  );
  const booksTotal = availableBooks.reduce(
      (sum, b) => sum + Number(b.price || 0),
      0
  );
  const totalPrice = coursesTotal + booksTotal;

  // ====== APPLY VOUCHER ======
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError("Vui lòng nhập mã giảm giá");
      return;
    }

    if (courses.length === 0 && availableBooks.length === 0) {
      setVoucherError("Giỏ hàng trống");
      return;
    }

    try {
      setVoucherApplying(true);
      setVoucherError(null);

      const itemsForVoucher = [
        ...courses.map((c) => ({
          id: c._id!,
          type: "course" as const,
          price: Number(c.price || 0),
          quantity: 1,
        })),
        ...availableBooks.map((b) => ({
          id: b._id!,
          type: "book" as const,
          price: Number(b.price || 0),
          quantity: 1,
        })),
      ];

      const data = await voucherApi.apply({
        code: voucherCode.trim(),
        items: itemsForVoucher,
      });


      if (!data?.success) {
        setVoucherResult(null);
        setVoucherError(data?.message || "Mã giảm giá không hợp lệ");
        return;
      }

      setVoucherResult(data.data!);
      setVoucherError(null);
    } catch (err: any) {
      console.error("Apply voucher error:", err);
      setVoucherResult(null);
      setVoucherError(err?.message || "Có lỗi xảy ra khi áp dụng mã giảm giá");
    } finally {
      setVoucherApplying(false);
    }
  };


  const handleRemoveVoucher = () => {
    setVoucherCode("");
    setVoucherResult(null);
    setVoucherError(null);
  };

  // tổng cuối cùng sau khi áp mã (nếu có)
  const finalPrice = voucherResult?.finalTotal ?? totalPrice;
  const discountAmount = voucherResult?.discount ?? 0;

  const handleCheckout = async () => {
    if (courses.length === 0 && books.length === 0) {
      alert("Giỏ hàng trống!");
      return;
    }

    // Check if there are purchased books in cart
    if (purchasedBooksInCart.length > 0) {
      const purchasedTitles = purchasedBooksInCart.map((b) => b.title).join(", ");
      const confirm = window.confirm(
          `Bạn đã mua các sách sau: ${purchasedTitles}\n\nBạn có muốn tiếp tục thanh toán cho các sản phẩm khác không?`
      );
      if (!confirm) return;
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
        ...availableBooks.map((b) => ({
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

      const payload: any = {
        items,
        paymentMethod: payment,
        // gửi kèm voucherCode để BE tái validate khi tạo order
      };

      if (voucherResult?.voucher?.code) {
        payload.voucherCode = voucherResult.voucher.code;
      } else if (voucherCode.trim()) {
        payload.voucherCode = voucherCode.trim();
      }

      if (user?.email) payload.email = user.email;

      const res = await paymentsApi.createPaymentLink(payload);
      const checkoutUrl = (res as any)?.checkoutUrl;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
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

          {/* Warning for purchased books */}
          {purchasedBooksInCart.length > 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-semibold mb-2">
                  ⚠️ Bạn đã mua các sách sau:
                </p>
                <ul className="text-sm text-yellow-700 list-disc list-inside">
                  {purchasedBooksInCart.map((b) => (
                      <li key={b._id}>{b.title}</li>
                  ))}
                </ul>
                <p className="text-xs text-yellow-600 mt-2">
                  Các sách đã mua sẽ không được tính vào đơn thanh toán. Bạn có thể xóa chúng khỏi giỏ hàng.
                </p>
              </div>
          )}

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

            {/* BOOKS (ebook) */}
            {books.map((b) => {
              const totalBookPrice = b.price || 0;
              const isPurchased = purchasedBookIds.has(b._id);
              return (
                  <div
                      key={b._id}
                      className={`grid grid-cols-5 items-center gap-4 p-4 border-b last:border-b-0 ${
                          isPurchased ? "bg-yellow-50 opacity-75" : ""
                      }`}
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
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800">{b.title}</p>
                        {isPurchased && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded-full font-semibold">
                        Đã mua
                      </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Giá: {formatVND(b.price || 0)}₫ / ebook
                        {isPurchased && (
                            <span className="text-yellow-600 ml-2">(Đã sở hữu)</span>
                        )}
                      </p>
                    </div>
                    <div className="col-span-1 flex items-center justify-between text-right">
                      <p
                          className={`text-sm font-semibold ${
                              isPurchased
                                  ? "text-yellow-600 line-through"
                                  : "text-green-700"
                          }`}
                      >
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

        {/* Cột phải: hình thức thanh toán + voucher */}
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

          {/* VOUCHER BOX */}
          <div className="mb-5">
            <p className="text-sm font-semibold mb-2">Mã giảm giá</p>
            <div className="flex gap-2">
              <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Nhập mã voucher"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {voucherResult ? (
                  <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="px-3 py-2 text-xs font-semibold border border-red-400 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    Hủy
                  </button>
              ) : (
                  <button
                      type="button"
                      onClick={handleApplyVoucher}
                      disabled={voucherApplying}
                      className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {voucherApplying ? "Đang áp..." : "Áp dụng"}
                  </button>
              )}
            </div>
            {voucherError && (
                <p className="mt-1 text-xs text-red-600">{voucherError}</p>
            )}
            {voucherResult && !voucherError && (
                <p className="mt-1 text-xs text-green-700">
                  Đã áp dụng mã <b>{voucherResult.voucher.code}</b> – Giảm{" "}
                  {formatVND(voucherResult.discount)}₫
                </p>
            )}
          </div>

          <div className="space-y-1 mb-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Tạm tính</span>
              <span className="font-medium text-gray-800">
              {formatVND(totalPrice)}₫
            </span>
            </div>
            {discountAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Giảm giá</span>
                  <span className="font-medium text-red-600">
                -{formatVND(discountAmount)}₫
              </span>
                </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">Tổng tiền thanh toán</span>
            <span className="text-lg font-semibold text-green-700">
            {formatVND(finalPrice)}₫
          </span>
          </div>

          <button
              onClick={handleCheckout}
              disabled={loading || (courses.length === 0 && availableBooks.length === 0)}
              className="w-full mb-3 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? "Đang tạo link..." : "Thanh toán ngay"}
          </button>
          {courses.length === 0 &&
              availableBooks.length === 0 &&
              purchasedBooksInCart.length > 0 && (
                  <p className="text-xs text-gray-500 text-center mb-3">
                    Vui lòng xóa các sách đã mua hoặc thêm sản phẩm khác để tiếp tục thanh toán
                  </p>
              )}

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
