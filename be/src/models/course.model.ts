import mongoose, { Schema, Document } from "mongoose";

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  price: number;
  thumbnail_url?: string;
  teacher: mongoose.Types.ObjectId | mongoose.Types.ObjectId[];
  category: mongoose.Types.ObjectId | mongoose.Types.ObjectId[];
  status: "pending" | "approved" | "rejected";
  is_published?: boolean;
  draft?: Record<string, any> | undefined;
  has_pending_changes?: boolean;
  pending_by?: mongoose.Types.ObjectId | null;
  pending_at?: Date | null;
  lessons: mongoose.Types.ObjectId[];


}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    thumbnail_url: { type: String },
    teacher: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    category: [{ type: Schema.Types.ObjectId, ref: "Category", required: true }],

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    is_published: { type: Boolean, default: false, index: true },

    lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
    draft: { type: Schema.Types.Mixed, default: undefined },
    has_pending_changes: { type: Boolean, default: false, index: true },
    pending_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    pending_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "courses" }
);

export default mongoose.model<ICourse>("Course", courseSchema);
