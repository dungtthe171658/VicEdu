import axios from "./axios";
import type { Lesson } from "../types/lesson";

export interface LessonPayload {
  title: string;
  video_url?: string;
  duration_minutes?: number;
  position?: number;
  description?: string;
}

const lessonApi = {
  listByCourse: (courseId: string): Promise<Lesson[]> =>
    axios.get(`/lesson/courses/${courseId}/lessons`),

  getById: (lessonId: string): Promise<Lesson> => axios.get(`/lesson/${lessonId}`),

  create: (courseId: string, data: LessonPayload): Promise<Lesson> =>
    axios.post(`/lesson/courses/${courseId}/lessons`, data),

  update: (lessonId: string, data: LessonPayload): Promise<Lesson> =>
    axios.put(`/lesson/${lessonId}`, data),

  delete: (lessonId: string): Promise<{ message: string }> => axios.delete(`/lesson/${lessonId}`),

  playback: (lessonId: string): Promise<{ playbackUrl: string; expiresIn?: number }> =>
    axios.get(`/lesson/${lessonId}/playback`),
};

export default lessonApi;
