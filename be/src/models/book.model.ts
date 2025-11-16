import mongoose, { Schema, Document } from "mongoose";

export interface IBook extends Document {
  title: string;
  slug: string;
  author?: string;
  description?: string;
  price: number;
  category_id: mongoose.Types.ObjectId;
  is_published?: boolean;
  images?: string[]; // 🆕 hỗ trợ nhiều ảnh
   pdf_url?: string; 
  created_at?: Date;
  updated_at?: Date;
}

const bookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true },
    author: { type: String },
    description: { type: String },
    price: { type: Number, required: true, min: 0, default: 0 },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    is_published: { type: Boolean, default: true },
    images: [{ type: String }], // 🆕 mảng chứa URL hoặc đường dẫn ảnh
    pdf_url: { type: String }, 
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default mongoose.model<IBook>("Book", bookSchema);
