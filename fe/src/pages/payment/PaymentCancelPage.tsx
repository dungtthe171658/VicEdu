// src/pages/PaymentCancel.tsx
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "../../api/axios";

export default function PaymentCancel() {
  const [sp] = useSearchParams();
  const [done, setDone] = useState(false);
  const orderId = sp.get("orderId") || "";
  const orderCode = sp.get("orderCode") || "";

  useEffect(() => {
    (async () => {
      try {
        await axios.post("/api/payments/cancel", { orderId, orderCode });
      } catch (e) {
        console.error("cancel API err", e);
      } finally {
        setDone(true);
      }
    })();
  }, [orderId, orderCode]);

  return (
    <div className="max-w-3xl mx-auto py-16 text-center">
      <h1 className="text-2xl font-semibold text-red-600">Thanh toán bị hủy ❌</h1>
      <p className="mt-2 text-gray-600">
        {done ? "Đã ghi nhận hủy đơn." : "Đang ghi nhận hủy đơn…"}
      </p>
      <div className="mt-6 flex gap-3 justify-center">
        <Link to="/cart" className="px-4 py-2 rounded bg-blue-600 text-white">Quay lại giỏ hàng</Link>
        <Link to="/" className="px-4 py-2 rounded bg-gray-200">Về trang chủ</Link>
      </div>
    </div>
  );
}
