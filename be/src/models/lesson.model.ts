import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILesson extends Document {
  title: string;
  video_url?: string;
  duration_minutes: number;
  course_id: mongoose.Types.ObjectId;
  position: number;
}

const lessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true, trim: true },
    video_url: { type: String, trim: true },
    duration_minutes: { type: Number, default: 0, min: 0 },
    course_id: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    position: { type: Number, required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "lessons" }
);


export default mongoose.model<ILesson>("Lesson", lessonSchema);