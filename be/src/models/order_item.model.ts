import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderItem extends Document {
  order_id: mongoose.Types.ObjectId;
  product_id: mongoose.Types.ObjectId;
  product_type: 'Course' | 'Book';
  price_at_purchase: number;
  quantity: number;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    order_id: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    product_id: { type: Schema.Types.ObjectId, required: true, refPath: 'product_type' },
    product_type: { type: String, required: true, enum: ['Course', 'Book'] },
    price_at_purchase: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "order_items" }
);

const OrderItemModel: Model<IOrderItem> = mongoose.models.OrderItem || mongoose.model<IOrderItem>("OrderItem", orderItemSchema);
export default OrderItemModel;