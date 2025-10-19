import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrder extends Document {
  user_id: mongoose.Types.ObjectId;
  total_amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method?: string;
}

const orderSchema = new Schema<IOrder>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    total_amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    payment_method: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "orders" }
);


export default mongoose.model<IOrder>("Order", orderSchema);