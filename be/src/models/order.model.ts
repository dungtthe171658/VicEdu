import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  user_id: mongoose.Types.ObjectId;
  total_amount: number;
  status: "pending" | "completed" | "failed" | "cancelled";
  payment_method?: "payos" | "vnpay" | "bank"; // các phương thức bạn hỗ trợ
  order_code?: number;                // mã duy nhất để đối soát PayOS/VNPay
  gateway_txn_id?: string;            // mã giao dịch từ cổng (nếu có)
  paid_at?: Date;                     // thời điểm thanh toán thành công
  meta?: any;                         // dữ liệu thô phục vụ đối soát
}

const orderSchema = new Schema<IOrder>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    total_amount: { type: Number, required: true, min: 0 },
    status: { 
      type: String, 
      enum: ["pending", "completed", "failed", "cancelled"], 
      default: "pending", 
      index: true 
    },
    payment_method: { type: String, enum: ["payos", "vnpay", "bank"], index: true },
    order_code: { type: Number, index: true, unique: true, sparse: true },
    gateway_txn_id: { type: String, index: true, sparse: true },
    paid_at: { type: Date },
    meta: { type: Schema.Types.Mixed },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, 
    collection: "orders" 
  }
);

// Index phục vụ truy vấn nhanh
orderSchema.index({ user_id: 1, created_at: -1 });
orderSchema.index({ user_id: 1, status: 1, created_at: -1 });

export default mongoose.model<IOrder>("Order", orderSchema);
