import axios from "./axios";
import type { Course } from "../types/course";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8888/api";

// Auth header handled by axios interceptor in ./axios via accessToken

const courseTeacherApi = {
  // Teacher list: only courses owned by the authenticated teacher
  getAll: (params?: Record<string, unknown>) =>
    axios.get(`${BASE_URL}/courses/teacher/all`, { params }),

  // Backend route is /api/courses/id/:id (not /:id)
  getById: (id: string) => axios.get(`${BASE_URL}/courses/id/${id}`),

  create: (data: Partial<Course>) => axios.post(`${BASE_URL}/courses`, data),

  update: (id: string, data: Partial<Course>) => axios.put(`${BASE_URL}/courses/${id}`, data),

  delete: (id: string) => axios.delete(`${BASE_URL}/courses/${id}`),

  // Publish flow
  requestPublish: (id: string) => axios.post(`${BASE_URL}/courses/${id}/request-publish`),
};

export default courseTeacherApi;
