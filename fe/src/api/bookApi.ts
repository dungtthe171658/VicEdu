import axios from "axios";
import type { BookDto } from "../types/book.d";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8888/api";

// Lấy token từ localStorage (hoặc từ context nếu bạn dùng)
const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken"); // Hoặc tên key token bạn dùng
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const bookApi = {
  getAll: (params?: Record<string, unknown>) =>
    axios.get(`${BASE_URL}/books`, { params }),

  getById: (id: string) => axios.get(`${BASE_URL}/books/${id}`),

  create: (data: Partial<BookDto>) =>
    axios.post(`${BASE_URL}/books`, data, { headers: getAuthHeaders() }),

  update: (id: string, data: Partial<BookDto>) =>
    axios.put(`${BASE_URL}/books/${id}`, data, { headers: getAuthHeaders() }),

  hide: (id: string) =>
    axios.patch(`${BASE_URL}/books/${id}/hide`, undefined, {
      headers: getAuthHeaders(),
    }),

  delete: (id: string) =>
    axios.delete(`${BASE_URL}/books/${id}`, { headers: getAuthHeaders() }),

  // ✅ updateStock có token để tránh 401
  updateStock: (id: string, stock: number) =>
    axios.put(
      `${BASE_URL}/books/${id}/stock`,
      { stock },
      { headers: getAuthHeaders() }
    ),
};

export default bookApi;
