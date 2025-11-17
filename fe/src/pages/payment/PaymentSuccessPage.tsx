import { Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useCart } from "../../contexts/CartContext";

export default function PaymentSuccessPage() {
  const [search] = useSearchParams();
  const orderId = search.get("orderId") ?? "";
  const { clear } = useCart();

  // Xóa giỏ hàng khi thanh toán thành công
  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
       
      </div>
    </div>
  );
}
