import axios from "axios";
import type { BookDto } from "../types/book.d";

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8888/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const bookApi = {
  getAll: (params?: Record<string, unknown>) =>
    axios.get(`${BASE_URL}/books`, { params }),

  getById: (id: string) => axios.get(`${BASE_URL}/books/${id}`),

  create: (data: Partial<BookDto>) =>
    axios.post(`${BASE_URL}/books`, data, {
      headers: getAuthHeaders(),
    }),

  update: (id: string, data: Partial<BookDto>) =>
    axios.put(`${BASE_URL}/books/${id}`, data, {
      headers: getAuthHeaders(),
    }),

  hide: (id: string) =>
    axios.patch(`${BASE_URL}/books/${id}/hide`, undefined, {
      headers: getAuthHeaders(),
    }),

  delete: (id: string) =>
    axios.delete(`${BASE_URL}/books/${id}`, {
      headers: getAuthHeaders(),
    }),

  getPdfUrl: (id: string) =>
    axios.get(`${BASE_URL}/books/${id}/pdf`, {
      headers: getAuthHeaders(),
    }),

  getPurchasedBooks: () =>
    axios.get(`${BASE_URL}/books/purchased`, {
      headers: getAuthHeaders(),
    }),

  // Alias per request: use controller getBookOrderAndOrderitem
  getBookOrderAndOrderitem: (params?: Record<string, unknown>) =>
    axios.get(`${BASE_URL}/books/purchased`, {
      headers: getAuthHeaders(),
      params,
    }),

  // Lấy danh sách ID các sách đã mua từ bookHistory
  getPurchasedBookIds: () =>
    axios.get(`${BASE_URL}/books/purchased/ids`, {
      headers: getAuthHeaders(),
    }),

  // Lấy danh sách sách đã mua từ bookHistory (không dùng getBookOrderAndOrderitem)
  getMyBooksFromHistory: () =>
    axios.get(`${BASE_URL}/books/my-books`, {
      headers: getAuthHeaders(),
    }),

  // [Admin/Teacher] Lấy số lượng sách đã mua của một user cụ thể
  getPurchasedBookCountByUserId: (userId: string) =>
    axios.get(`${BASE_URL}/books/admin/purchased-count/${userId}`, {
      headers: getAuthHeaders(),
    }),
};

export default bookApi;

