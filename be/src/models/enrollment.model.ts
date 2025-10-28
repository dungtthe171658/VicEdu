// src/models/enrollment.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IEnrollment extends Document {
  user_id: mongoose.Types.ObjectId;
  course_id: mongoose.Types.ObjectId;
  progress: number;
  completed_lessons: mongoose.Types.ObjectId[];
  status: "pending" | "active" | "cancelled";  
  activated_at?: Date | null;                    
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course_id: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completed_lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],

    // ⭐️ fields mới
    status: {
      type: String,
      enum: ["pending", "active", "cancelled"],
      default: "pending",
      index: true,
    },
    order_id: { type: Schema.Types.ObjectId, ref: "Order", default: null, index: true },
    activated_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "enrollments" }
);

// vẫn giữ unique theo user+course để không trùng (1 user 1 course 1 record)
enrollmentSchema.index({ user_id: 1, course_id: 1 }, { unique: true });

export default mongoose.model<IEnrollment>("Enrollment", enrollmentSchema);