import { Link, useSearchParams } from "react-router-dom";

export default function PaymentSuccessPage() {
  const [search] = useSearchParams();
  const orderId = search.get("orderId") ?? "";

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-green-700">Thanh toán thành công 🎉</h1>
      <p className="mt-3 text-gray-700">
        Cảm ơn bạn đã thanh toán. Mã đơn hàng:
        <span className="font-mono ml-1">{orderId || "(không có)"}</span>
      </p>

      <div className="mt-8 flex gap-3 justify-center">
        <Link
          to="/"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Về trang chủ
        </Link>
        <Link
          to="/courses"
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
        >
          Xem khóa học
        </Link>
      </div>
    </div>
  );
}
