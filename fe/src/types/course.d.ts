export type CourseStatus = 'pending' | 'approved' | 'rejected';

export interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  thumbnail_url?: string;
  teacher_id: string;
  category_id: string;
  status: CourseStatus;
  lessons: string[];
  created_at?: string;
  updated_at?: string;
}