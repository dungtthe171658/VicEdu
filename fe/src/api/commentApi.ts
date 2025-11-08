import axios from "./axios";
import type { CommentListResponse, LessonComment, TeacherCommentQuery } from "../types/comment";

const commentApi = {
  listByLesson: (lessonId: string, params?: Record<string, unknown>): Promise<CommentListResponse> =>
    axios.get(`/comments/lesson/${lessonId}`, { params }),

  create: (payload: { lesson_id: string; content: string; parent_id?: string }): Promise<LessonComment> =>
    axios.post("/comments", payload),

  listForTeacher: (params?: TeacherCommentQuery): Promise<CommentListResponse> =>
    axios.get("/comments/teacher", { params }),

  updateStatus: (commentId: string, status: "open" | "resolved"): Promise<LessonComment> =>
    axios.patch(`/comments/${commentId}/status`, { status }),
};

export default commentApi;

