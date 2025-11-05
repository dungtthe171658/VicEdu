import type { Category } from "./category";

export type CourseStatus = "pending" | "approved" | "rejected";

export interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price_cents: number;
  thumbnail_url?: string;
  teacher_id: string;
  teacher_ids?: string[];
  category_id: string;
  is_published: boolean;
  status: CourseStatus;
  category: Category;
  lessons: string[];
  created_at?: string;
  updated_at?: string;
  teacherNames?: string[];
  teacher?: Teacher;
}
