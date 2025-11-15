import axios from "axios";
import type { Category } from "../types/category";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8888/api";

// 🔹 Helper để lấy auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const categoryApi = {
  // 🔹 Lấy tất cả categories
  getAll: (params?: Record<string, unknown>) =>
    axios.get(`${BASE_URL}/categories`, { params }),

  // 🔹 Lấy category theo id
  getById: (id: string) => axios.get(`${BASE_URL}/categories/${id}`),

  // 🔹 Tạo mới category
  create: (data: Partial<Category>) =>
    axios.post(`${BASE_URL}/categories`, data, { headers: getAuthHeaders() }),

  // 🔹 Cập nhật category
  update: (id: string, data: Partial<Category>) =>
    axios.put(`${BASE_URL}/categories/${id}`, data, { headers: getAuthHeaders() }),

  // 🔹 Xóa category
  delete: (id: string) => axios.delete(`${BASE_URL}/categories/${id}`, { headers: getAuthHeaders() }),
};

export default categoryApi;
