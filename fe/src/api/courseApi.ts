import axios from "axios";
import type { Course } from "../types/course";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8888/api";

const courseApi = {
  // Lấy tất cả khóa học
  getAll: (params?: Record<string, unknown>) =>
    axios.get(`${BASE_URL}/courses`, { params }),

  // Lấy chi tiết 1 khóa học
  getById: (id: string) => axios.get(`${BASE_URL}/courses/${id}`),

  // Tạo khóa học mới
  create: (data: Partial<Course>) => axios.post(`${BASE_URL}/courses`, data),

  // Cập nhật khóa học
  update: (id: string, data: Partial<Course>) =>
    axios.put(`${BASE_URL}/courses/${id}`, data),

  // Ẩn / Hiện khóa học (nếu có chức năng này)
  hide: (id: string) => axios.patch(`${BASE_URL}/courses/${id}/hide`),

  // Xóa khóa học
  delete: (id: string) => axios.delete(`${BASE_URL}/courses/${id}`),
};

export default courseApi;
