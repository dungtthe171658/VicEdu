import { Link, useSearchParams } from "react-router-dom";

export default function PaymentCancelPage() {
  const [search] = useSearchParams();
  const orderId = search.get("orderId") ?? "";

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-red-600">Thanh toán bị hủy ❌</h1>
      <p className="mt-3 text-gray-700">
        Đơn hàng:
        <span className="font-mono ml-1">{orderId || "(không có)"}</span>
      </p>
      <p className="mt-1 text-gray-600">Bạn có thể thử thanh toán lại.</p>

      <div className="mt-8 flex gap-3 justify-center">
        <Link
          to="/cart"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Quay lại giỏ hàng
        </Link>
        <Link
          to="/"
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
