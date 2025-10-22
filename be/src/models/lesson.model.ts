import mongoose, { Schema, Document } from "mongoose";

export interface ILesson extends Document {
  title: string;
  video_url?: string;            // video cũ (nếu có)
  duration_minutes: number;
  course_id: mongoose.Types.ObjectId;
  position: number;
  
  status?: "pending" | "uploading" | "processing" | "ready" | "failed";
  source_key?: string;           // key file upload gốc (S3 uploads/)
  output_prefix?: string;        // prefix HLS (S3 output/hls/<lessonId>/)
  playback_url?: string;         // URL phát HLS (CloudFront)
}

const lessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true, trim: true },
    video_url: { type: String, trim: true },           // giữ để backward-compat
    duration_minutes: { type: Number, default: 0, min: 0 },
    course_id: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    position: { type: Number, required: true },

    status: { type: String, enum: ["pending", "uploading", "processing", "ready", "failed"], default: "pending", index: true },
    source_key: { type: String },
    output_prefix: { type: String },
    playback_url: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "lessons" }
);

export default mongoose.model<ILesson>("Lesson", lessonSchema);
