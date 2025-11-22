// src/models/bookHistory.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IBookHistory extends Document {
  user_id: mongoose.Types.ObjectId;
  book_id: mongoose.Types.ObjectId;
  order_id: mongoose.Types.ObjectId;
  price_at_purchase: number;
  purchased_at: Date;
  status: "active" | "cancelled";
  created_at?: Date;
  updated_at?: Date;
}

const bookHistorySchema = new Schema<IBookHistory>(
  {
    user_id: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true
    },
    book_id: { 
      type: Schema.Types.ObjectId, 
      ref: "Book", 
      required: true,
      index: true
    },
    order_id: { 
      type: Schema.Types.ObjectId, 
      ref: "Order", 
      required: true,
      index: true
    },
    price_at_purchase: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    purchased_at: { 
      type: Date, 
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
      index: true,
    },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "book_histories"
  }
);

// Unique index: mỗi user chỉ có 1 record cho mỗi book (tránh trùng lặp)
bookHistorySchema.index({ user_id: 1, book_id: 1 }, { unique: true });

// Index để query nhanh theo user và status
bookHistorySchema.index({ user_id: 1, status: 1 });

export default mongoose.model<IBookHistory>("BookHistory", bookHistorySchema);



