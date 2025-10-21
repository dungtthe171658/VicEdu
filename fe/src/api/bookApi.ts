//bookApi.ts

import axios from "axios";
import type { BookDto } from "../types/book.d";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8888/api";

const bookApi = {
  getAll: (params?: Record<string, unknown>) =>
    axios.get(`${BASE_URL}/books`, { params }),

  getById: (id: string) => axios.get(`${BASE_URL}/books/${id}`),

  create: (data: Partial<BookDto>) => axios.post(`${BASE_URL}/books`, data),

  update: (id: string, data: Partial<BookDto>) =>
    axios.put(`${BASE_URL}/books/${id}`, data),

  hide: (id: string) => axios.patch(`${BASE_URL}/books/${id}/hide`),

  delete: (id: string) => axios.delete(`${BASE_URL}/books/${id}`),
};

export default bookApi;
