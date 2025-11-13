// src/api/orderApi.ts
import axios from "axios";
import type { OrderDto } from "../types/order";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8888/api";

// 🔹 Tạo axios instance có interceptor tự động chèn accessToken
const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken"); // 🔸 Trùng với key bạn đang dùng
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface OrderItem {
  _id: string;
  product_type: "Course" | "Book";
  product_id: string;
  price_at_purchase: number;
  quantity: number;
  product: {
    _id: string;
    title: string;
    slug: string;
    price?: number;
    price_cents?: number;
    thumbnail_url?: string;
    images?: string[];
    // For Course products
    teacher?: string | string[] | any;
  } | null;
}

export interface OrderItemsResponse {
  order_id: string;
  items: OrderItem[];
}

const orderApi = {
  getAll: async (): Promise<OrderDto[]> => {
    const res = await api.get("/orders");
    // Tránh lỗi nếu backend trả về data khác cấu trúc
    return res.data?.data || res.data || [];
  },

  getById: (id: string) => api.get(`/orders/${id}`),

  getOrderItems: async (id: string): Promise<OrderItemsResponse> => {
    const res = await api.get(`/orders/${id}/items`);
    return res.data;
  },

  create: (data: Partial<OrderDto>) => api.post("/orders", data),

  update: (id: string, data: Partial<OrderDto>) => api.put(`/orders/${id}`, data),

  delete: (id: string) => api.delete(`/orders/${id}`),
};

export default orderApi;
