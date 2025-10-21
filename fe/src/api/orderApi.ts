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

const orderApi = {
  getAll: async (): Promise<OrderDto[]> => {
    const res = await api.get("/orders");
    // Tránh lỗi nếu backend trả về data khác cấu trúc
    return res.data?.data || res.data || [];
  },

  getById: (id: string) => api.get(`/orders/${id}`),

  create: (data: Partial<OrderDto>) => api.post("/orders", data),

  update: (id: string, data: Partial<OrderDto>) => api.put(`/orders/${id}`, data),

  delete: (id: string) => api.delete(`/orders/${id}`),
};

export default orderApi;
