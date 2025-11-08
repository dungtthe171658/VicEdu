import type { UserRole } from "./user.d";

export interface LessonCommentUser {
  _id: string;
  name?: string;
  avatar?: string;
  role?: UserRole;
}

export interface LessonSummary {
  _id: string;
  title?: string;
  position?: number;
}

export interface CourseSummary {
  _id: string;
  title?: string;
  slug?: string;
}

export interface LessonComment {
  _id: string;
  lesson_id: string;
  course_id: string;
  parent_id?: string | null;
  root_id?: string | null;
  content: string;
  status: "open" | "resolved";
  reply_count?: number;
  teacher_reply_count?: number;
  last_activity_at?: string;
  last_teacher_reply_at?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  created_at?: string;
  updated_at?: string;
  user?: LessonCommentUser | null;
  lesson?: LessonSummary | null;
  course?: CourseSummary | null;
  replies?: LessonComment[];
}

export interface CommentListResponse {
  data: LessonComment[];
  count?: number;
  total?: number;
  nextCursor?: string | null;
  page?: number;
  limit?: number;
}

export interface TeacherCommentQuery {
  page?: number;
  limit?: number;
  courseId?: string;
  lessonId?: string;
  status?: "open" | "resolved";
  search?: string;
  onlyUnanswered?: boolean;
}

