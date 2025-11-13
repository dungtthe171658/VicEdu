import { useEffect, useState } from "react";
import orderApi, { type OrderItem } from "../../api/orderApi";

interface OrderDetailModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

const formatVND = (n: number) => (n ?? 0).toLocaleString("vi-VN") + "đ";

export default function OrderDetailModal({
  orderId,
  isOpen,
  onClose,
}: OrderDetailModalProps) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderItems();
    } else {
      setItems([]);
      setError(null);
    }
  }, [isOpen, orderId]);

  const loadOrderItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.getOrderItems(orderId);
      setItems(data.items || []);
    } catch (e: any) {
      setError(e?.message || "Không thể tải chi tiết đơn hàng");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            Chi tiết đơn hàng
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Không có sản phẩm nào trong đơn hàng này.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {item.product_type === "Course" && item.product?.thumbnail_url ? (
                        <img
                          src={item.product.thumbnail_url}
                          alt={item.product.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      ) : item.product_type === "Book" && item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {item.product_type === "Course" ? "Khóa học" : "Sách"}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-800 truncate">
                            {item.product?.title || "Sản phẩm không tồn tại"}
                          </h3>
                          {item.product?.slug && (
                            <p className="text-sm text-gray-500 truncate">
                              {item.product.slug}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price and Quantity */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Số lượng:</span> {item.quantity}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            Đơn giá: {formatVND(item.price_at_purchase)}
                          </div>
                          <div className="text-lg font-semibold text-gray-800 mt-1">
                            {formatVND(item.price_at_purchase * item.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Tổng cộng:</span>
              <span className="text-xl font-bold text-gray-800">
                {formatVND(
                  items.reduce(
                    (sum, item) => sum + item.price_at_purchase * item.quantity,
                    0
                  )
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

