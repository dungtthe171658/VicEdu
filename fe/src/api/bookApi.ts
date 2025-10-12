import axios from "axios";
import type { BookDto } from "../types/book.d";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8888/api/books";

const bookApi = {
  getAll: (params?: Record<string, unknown>) => axios.get(API_URL, { params }),

  getById: (id: string) => axios.get(`${API_URL}/${id}`),

  create: (data: Partial<BookDto>) => axios.post(API_URL, data),

  update: (id: string, data: Partial<BookDto>) =>
    axios.put(`${API_URL}/${id}`, data),

  hide: (id: string) => axios.patch(`${API_URL}/${id}/hide`),

  delete: (id: string) => axios.delete(`${API_URL}/${id}`),
};

export default bookApi;
