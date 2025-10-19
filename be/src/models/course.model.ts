import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  price: number;
  thumbnail_url?: string;
  teacher_id: mongoose.Types.ObjectId;
  category_id: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  lessons: mongoose.Types.ObjectId[];
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    thumbnail_url: { type: String },
    teacher_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category_id: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "courses" }
);


export default mongoose.model<ICourse>("Course", courseSchema);;