import mongoose, { Schema, Document } from "mongoose";

export type LessonCommentStatus = "open" | "resolved";

export interface ILessonComment extends Document {
  course_id: mongoose.Types.ObjectId;
  lesson_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  parent_id?: mongoose.Types.ObjectId | null;
  root_id?: mongoose.Types.ObjectId | null;
  content: string;
  status: LessonCommentStatus;
  reply_count: number;
  teacher_reply_count: number;
  attachments?: string[];
  last_activity_at: Date;
  last_activity_by?: mongoose.Types.ObjectId | null;
  last_teacher_reply_at?: Date | null;
  resolved_by?: mongoose.Types.ObjectId | null;
  resolved_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const lessonCommentSchema = new Schema<ILessonComment>(
  {
    course_id: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    lesson_id: { type: Schema.Types.ObjectId, ref: "Lesson", required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    parent_id: { type: Schema.Types.ObjectId, ref: "LessonComment", default: null, index: true },
    root_id: { type: Schema.Types.ObjectId, ref: "LessonComment", default: null, index: true },
    content: { type: String, required: true, trim: true },
    status: { type: String, enum: ["open", "resolved"], default: "open", index: true },
    reply_count: { type: Number, default: 0 },
    teacher_reply_count: { type: Number, default: 0 },
    attachments: [{ type: String }],
    last_activity_at: { type: Date, default: Date.now, index: true },
    last_activity_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    last_teacher_reply_at: { type: Date, default: null },
    resolved_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    resolved_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "lesson_comments",
  }
);

lessonCommentSchema.index({ lesson_id: 1, status: 1 });
lessonCommentSchema.index({ course_id: 1, status: 1 });
lessonCommentSchema.index({ root_id: 1 });
lessonCommentSchema.index({ parent_id: 1 });
lessonCommentSchema.index({ last_activity_at: -1 });

export default mongoose.model<ILessonComment>("LessonComment", lessonCommentSchema);

