import axios from "axios";
import type { ReviewDto } from "../types/review";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8888/api";

const reviewApi = {
  getAll: () => axios.get(`${BASE_URL}/reviews/public`),
  updateStatus: (id: string, status: string) => axios.patch(`${BASE_URL}/reviews/${id}/approve`, { status }, {
    headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
  }),
  delete: (id: string) => axios.delete(`${BASE_URL}/reviews/${id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
  }),
};

export default reviewApi;
