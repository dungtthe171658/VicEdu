import axios from "./axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8888/api";

export type EditHistoryItem = {
  _id: string;
  target_type: "course" | "lesson";
  target_id: string;
  submitted_by: string;
  submitted_role: "admin" | "teacher" | "system";
  status: "pending" | "approved" | "rejected" | "applied";
  before: Record<string, any>;
  after: Record<string, any>;
  changes: Record<string, { from: any; to: any }>;
  reason?: string;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at?: string;
};

const historyApi = {
  listByCourse: (courseId: string): Promise<{ data: EditHistoryItem[]; count: number }> =>
    axios.get(`${BASE_URL}/history/course/${courseId}`),
  listByLesson: (lessonId: string): Promise<{ data: EditHistoryItem[]; count: number }> =>
    axios.get(`${BASE_URL}/history/lesson/${lessonId}`),
  // Admin aggregate
  listAdminPendingAll: (): Promise<{ data: EditHistoryItem[]; count: number }> =>
    axios.get(`${BASE_URL}/history/admin/pending/all`),
  listAdminRecent: (params?: { status?: string; limit?: number }): Promise<{ data: EditHistoryItem[]; count: number }> =>
    axios.get(`${BASE_URL}/history/admin/recent`, { params }),
  // Teacher aggregate (own)
  listMyRecent: (params?: { status?: string; limit?: number }): Promise<{ data: EditHistoryItem[]; count: number }> =>
    axios.get(`${BASE_URL}/history/my/recent`, { params }),
};

export default historyApi;
