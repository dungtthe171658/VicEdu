import axios from "./axios";
import type { Course } from "../types/course";

// Auth header handled by axios interceptor in ./axios via accessToken
// Use relative paths since axios instance already has baseURL configured

const courseAdminApi = {
  // Admin list should use the admin endpoint to include all courses
  getAll: (params?: Record<string, unknown>) =>
    axios.get("/courses/admin/all", { params }),

  // Backend route is /api/courses/id/:id (not /:id)
  getById: (id: string) => axios.get(`/courses/id/${id}`),

  create: (data: Partial<Course>) => axios.post("/courses", data),

  update: (id: string, data: Partial<Course>) => axios.put(`/courses/${id}`, data),

  delete: (id: string) => axios.delete(`/courses/${id}`),

  updateStatus: (id: string, status: 'approved' | 'rejected' | 'pending') =>
    axios.patch(`/courses/${id}/status`, { status }),

  // Moderation (admin)
  approveChanges: (id: string) => axios.post(`/courses/${id}/approve-changes`),
  rejectChanges: (id: string) => axios.post(`/courses/${id}/reject-changes`),
  getPending: () => axios.get("/courses/admin/pending"),

  // Publish approval
  approvePublish: (id: string) => axios.post(`/courses/${id}/approve-publish`),
  rejectPublish: (id: string) => axios.post(`/courses/${id}/reject-publish`),
};

export default courseAdminApi;
