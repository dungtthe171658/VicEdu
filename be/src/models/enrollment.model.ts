import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEnrollment extends Document {
  user_id: mongoose.Types.ObjectId;
  course_id: mongoose.Types.ObjectId;
  progress: number;
  completed_lessons: mongoose.Types.ObjectId[];
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course_id: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completed_lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "enrollments" }
);

enrollmentSchema.index({ user_id: 1, course_id: 1 }, { unique: true });


export default mongoose.model<IEnrollment>("Enrollment", enrollmentSchema);