import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
  user_id: mongoose.Types.ObjectId;
  product_id: mongoose.Types.ObjectId;
  product_type: 'Course' | 'Book';
  rating: number;
  comment?: string;
  status: 'pending' | 'approved';
}

const reviewSchema = new Schema<IReview>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product_id: { type: Schema.Types.ObjectId, required: true, refPath: 'product_type' },
    product_type: { type: String, required: true, enum: ['Course', 'Book'] },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "reviews" }
);

const ReviewModel: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>("Review", reviewSchema);
export default ReviewModel;