// src/pages/dashboard/Admin/ManageOrdersPage.tsx
import { useState, useEffect } from "react";
import orderApi from "../../../api/orderApi";
import type { OrderDto } from "../../../types/order";
import "./ManageOrdersPage.css";

const ManageOrdersPage = () => {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Tải danh sách đơn hàng
  const loadOrders = async () => {
  try {
    setLoading(true);
    const data = await orderApi.getAll();
    console.log("📦 Orders from API:", data); // <--- thêm dòng này
    setOrders(data);
  } catch (error) {
    console.error("Error loading orders:", error);
    alert("Không thể tải danh sách đơn hàng!");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadOrders();
  }, []);

  // ✅ Xóa đơn hàng
  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc muốn xóa đơn hàng này?")) {
      try {
        await orderApi.delete(id);
        loadOrders();
      } catch (error) {
        console.error("Error deleting order:", error);
        alert("Không thể xóa đơn hàng!");
      }
    }
  };

  // ✅ Hiển thị màu trạng thái
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "green";
      case "pending":
        return "orange";
      case "cancelled":
        return "gray";
      case "failed":
        return "red";
      default:
        return "black";
    }
  };

  return (
    <div className="order-management-container">
      <div className="header">
        <h2>Quản lý đơn hàng</h2>
        <button className="refresh-btn" onClick={loadOrders}>
          Làm mới
        </button>
      </div>

      {loading ? (
        <p>Đang tải danh sách đơn hàng...</p>
      ) : orders.length === 0 ? (
        <p>Không có đơn hàng nào.</p>
      ) : (
        <table className="order-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Người dùng</th>
              <th>Trạng thái</th>
              <th>Tổng tiền</th>
              <th>Ngày tạo</th>
              <th>Phương thức thanh toán</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order._id}</td>
                <td>{typeof order.user_id === "object" ? order.user_id?.name : order.user_id}</td>
                <td style={{ color: getStatusColor(order.status) }}>
                  {order.status}
                </td>
                <td>
                  {order.total_amount.toLocaleString("vi-VN")} ₫
                </td>
                <td>
                  {order.created_at
                    ? new Date(order.created_at).toLocaleString("vi-VN")
                    : "—"}
                </td>
                <td>{order.payment_method || "Không rõ"}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(order._id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageOrdersPage;
