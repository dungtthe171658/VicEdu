import axios from "./axios";
import type { Course } from "../types/course";

// Auth header handled by axios interceptor in ./axios via accessToken
// Use relative paths since axios instance already has baseURL configured

const courseTeacherApi = {
  // Teacher list: only courses owned by the authenticated teacher
  getAll: (params?: Record<string, unknown>) =>
    axios.get("/courses/teacher/all", { params }),

  // Backend route is /api/courses/id/:id (not /:id)
  getById: (id: string) => axios.get(`/courses/id/${id}`),

  create: (data: Partial<Course>) => axios.post("/courses", data),

  update: (id: string, data: Partial<Course>) => axios.put(`/courses/${id}`, data),

  delete: (id: string) => axios.delete(`/courses/${id}`),

  // Publish flow
  requestPublish: (id: string) => axios.post(`/courses/${id}/request-publish`),
};

export default courseTeacherApi;
