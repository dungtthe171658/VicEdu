import mongoose, { Schema, Document } from "mongoose";

export interface ILessonReview {
  user_id: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ILesson extends Document {
  title: string;
  video_url?: string; // direct MP4 or public URL
  duration_minutes: number;
  course_id: mongoose.Types.ObjectId;
  position: number;
  description?: string;

  status?: "pending" | "uploading" | "processing" | "ready" | "failed";

  // Moderation draft and flags
  draft?: Record<string, any> | undefined;
  has_pending_changes?: boolean;
  pending_by?: mongoose.Types.ObjectId | null;
  pending_at?: Date | null;

  // Legacy (AWS/HLS)
  source_key?: string;
  output_prefix?: string;
  playback_url?: string;

  // Supabase Storage
  storage_provider?: "supabase";
  storage_bucket?: string;
  storage_path?: string;

  // Embedded user reviews for lesson
  reviews?: ILessonReview[];
}

const reviewSubSchema = new Schema<ILessonReview>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    _id: false,
  }
);

const lessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true, trim: true },
    video_url: { type: String, trim: true },
    duration_minutes: { type: Number, default: 0, min: 0 },
    course_id: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    position: { type: Number, required: true },
    description: { type: String, trim: true },

    status: {
      type: String,
      enum: ["pending", "uploading", "processing", "ready", "failed"],
      default: "pending",
      index: true,
    },

    // Legacy AWS/HLS
    source_key: { type: String, trim: true },
    output_prefix: { type: String, trim: true },
    playback_url: { type: String, trim: true },

    // Supabase
    storage_provider: { type: String, enum: ["supabase"], default: undefined },
    storage_bucket: { type: String, trim: true },
    storage_path: { type: String, trim: true },

    reviews: [reviewSubSchema],

    // Moderation fields
    draft: { type: Schema.Types.Mixed, default: undefined },
    has_pending_changes: { type: Boolean, default: false, index: true },
    pending_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    pending_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "lessons",
  }
);

lessonSchema.index({ course_id: 1, position: 1 }, { unique: true });

export default mongoose.model<ILesson>("Lesson", lessonSchema);

