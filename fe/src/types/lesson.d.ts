export type LessonStatus = "pending" | "uploading" | "processing" | "ready" | "failed";

export interface Lesson {
  _id: string;
  title: string;
  video_url?: string;
  duration_minutes: number;
  course_id: string;
  position: number;
  description?: string;
  status?: LessonStatus;
  playback_url?: string;
  storage_provider?: "supabase";
  storage_bucket?: string;
  storage_path?: string;
  reviews?: Array<{
    user_id: string;
    rating: number;
    comment?: string;
    created_at?: string;
    updated_at?: string;
  }>;
  created_at?: string;
  updated_at?: string;
}
