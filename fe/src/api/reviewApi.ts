import axios from "./axios";
import type { ReviewDto } from "../types/review";

const reviewApi = {
  // Admin list (requires admin token via interceptor)
  getAll: (params?: any) => axios.get(`/reviews`, { params }),
  // GET /api/reviews/count
  countAll: (): Promise<{ count: number }> => axios.get(`/reviews/count`),
  updateStatus: (id: string, status: string) => axios.patch(`/reviews/${id}/approve`, { status }),
  delete: (id: string) => axios.delete(`/reviews/${id}`),
};

export default reviewApi;
