import mongoose, { Schema, Document } from "mongoose";

export interface ILesson extends Document {
  title: string;
  video_url?: string;                 // legacy (MP4 trực tiếp)
  duration_minutes: number;
  course_id: mongoose.Types.ObjectId;
  position: number;

  status?: "pending" | "uploading" | "processing" | "ready" | "failed";

  // --- Legacy (AWS/HLS, giữ để không đứt dữ liệu cũ) ---
  source_key?: string;                // key file upload gốc (S3 uploads/)
  output_prefix?: string;             // prefix HLS (S3 output/hls/<lessonId>/)
  playback_url?: string;              // URL phát HLS/MP4 (CloudFront hoặc public URL)

  // --- Supabase Storage (mới) ---
  storage_provider?: "supabase";      // để sau mở rộng nếu cần
  storage_bucket?: string;            // vd: "videos"
  storage_path?: string;              // vd: "lessons/<lessonId>/<file>.mp4"
}

const lessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true, trim: true },
    video_url: { type: String, trim: true },            // legacy
    duration_minutes: { type: Number, default: 0, min: 0 },
    course_id: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    position: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "uploading", "processing", "ready", "failed"],
      default: "pending",
      index: true,
    },

    // Legacy AWS/HLS
    source_key: { type: String, trim: true },
    output_prefix: { type: String, trim: true },
    playback_url: { type: String, trim: true },         // dùng cho cả public Supabase URL

    // Supabase
    storage_provider: { type: String, enum: ["supabase"], default: undefined },
    storage_bucket: { type: String, trim: true },
    storage_path: { type: String, trim: true },         // "videos/lessons/<lessonId>/xxx.mp4"
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "lessons",
  }
);

// Gợi ý index thực tế khi list bài học theo khoá & thứ tự
lessonSchema.index({ course_id: 1, position: 1 }, { unique: true });

export default mongoose.model<ILesson>("Lesson", lessonSchema);
