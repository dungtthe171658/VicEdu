import axios from "axios";
import type { Course } from "../types/course";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8888/api";

// ✅ Lấy token từ localStorage (giống các API khác)
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const courseAdminApi = {
  getAll: (params?: Record<string, unknown>) =>
    axios.get(`${BASE_URL}/courses`, { params, headers: getAuthHeader() }),

  getById: (id: string) =>
    axios.get(`${BASE_URL}/courses/${id}`, { headers: getAuthHeader() }),

  create: (data: Partial<Course>) =>
    axios.post(`${BASE_URL}/courses`, data, { headers: getAuthHeader() }),

  update: (id: string, data: Partial<Course>) =>
    axios.put(`${BASE_URL}/courses/${id}`, data, { headers: getAuthHeader() }),

  delete: (id: string) =>
    axios.delete(`${BASE_URL}/courses/${id}`, { headers: getAuthHeader() }),
};

export default courseAdminApi;
