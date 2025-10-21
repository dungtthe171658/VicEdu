import axios from "axios";
import type { ReviewDto } from "../types/review";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8888/api";

// Lấy token admin từ localStorage
const token = localStorage.getItem("adminToken");

const reviewApi = {
  getAll: () =>
    axios.get(`${BASE_URL}/reviews`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateStatus: (id: string, status: string) =>
    axios.patch(`${BASE_URL}/reviews/${id}/approve`, { status }, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  delete: (id: string) =>
    axios.delete(`${BASE_URL}/reviews/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default reviewApi;
