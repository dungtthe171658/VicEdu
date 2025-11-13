import { useEffect, useMemo, useState } from "react";
import axios from "../../api/axios";
import dayjs from "dayjs";
import OrderDetailModal from "../../components/orders/OrderDetailModal";

type Order = {
  _id: string;
  total_amount: number;
  status: "pending" | "completed" | "failed" | "cancelled";
  payment_method?: string;
  order_code?: number;
  gateway_txn_id?: string;
  paid_at?: string;
  created_at?: string;
  updated_at?: string;
};

const formatVND = (n: number) => (n ?? 0).toLocaleString("vi-VN") + "đ";

const StatusBadge = ({ s }: { s: Order["status"] }) => {
  const map: Record<Order["status"], string> = {
    pending: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${map[s] || "bg-gray-100 text-gray-600"}`}>
      {s}
    </span>
  );
};

export default function OrderHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasOrders = useMemo(() => orders.length > 0, [orders]);

  const handleViewDetail = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrderId(null);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // BE đã có: GET /api/orders/my-orders (đã require auth)
        const res = await axios.get("/orders/my-orders");
        // interceptor của bạn trả thẳng data => res là mảng Order
        setOrders((res as Order[]) ?? []);
      } catch (e: any) {
        setError(e?.message || "Không thể tải danh sách đơn hàng");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">Đơn hàng của tôi</h1>
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Đơn hàng của tôi</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!hasOrders ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <p className="text-gray-600 mb-2">Bạn chưa có đơn hàng nào.</p>
          <p className="text-gray-500 text-sm">Hãy thêm khóa học hoặc sách vào giỏ và thanh toán.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o._id}
              className="bg-white rounded-xl shadow border border-gray-100 p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800 truncate">
                    Đơn hàng #{o.order_code || o._id.slice(-6)}
                  </span>
                  <StatusBadge s={o.status} />
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Tạo lúc:{" "}
                  {o.created_at
                    ? dayjs(o.created_at).format("HH:mm DD/MM/YYYY")
                    : "—"}
                  {o.paid_at && (
                    <>
                      {" "}• Thanh toán: {dayjs(o.paid_at).format("HH:mm DD/MM/YYYY")}
                    </>
                  )}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Phương thức: {o.payment_method?.toUpperCase() || "—"}
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-2">
                <div className="text-lg font-semibold text-gray-800">
                  {formatVND(o.total_amount || 0)}
                </div>
                <button
                  onClick={() => handleViewDetail(o._id)}
                  className="text-blue-600 text-sm hover:underline font-medium"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
