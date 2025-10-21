import { useSearchParams } from "react-router-dom";
export default function PaymentResultPage() {
  const [search] = useSearchParams();
  const orderId = search.get("orderId") || search.get("vnp_TxnRef") || "";
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Kết quả thanh toán</h1>
      <p className="mt-3 text-gray-700">Mã đơn hàng: <span className="font-mono">{orderId}</span></p>
    </div>
  );
}
