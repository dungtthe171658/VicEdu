import mongoose, { Document, Schema } from "mongoose";

const VoucherUsageSchema = new mongoose.Schema(
  {
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      // hoặc type: String nếu mày lưu user id kiểu string
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      // hoặc String, tuỳ mày
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

VoucherUsageSchema.index({ voucherId: 1, userId: 1 });

module.exports = mongoose.model('VoucherUsage', VoucherUsageSchema);
