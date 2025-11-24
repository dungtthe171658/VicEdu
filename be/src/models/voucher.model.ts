const mongoose = require('mongoose');

const VoucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, 
    },

    type: {
      type: String,
      enum: ['amount', 'percent'],
      required: true,
    },

    value: {
      type: Number,
      required: true,
      min: 0,
    },

    // 'book' | 'course' | 'both'
    applyTo: {
      type: String,
      enum: ['book', 'course', 'both'],
      default: 'both',
    },

    minOrderAmount: {
      type: Number,
      default: null,
    },

    maxDiscountAmount: {
      type: Number,
      default: null,
    },

    totalUsageLimit: {
      type: Number,
      default: null,
    },

    usedCount: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, 
  }
);

VoucherSchema.index({ code: 1 });
VoucherSchema.index({ isActive: 1, startAt: 1, endAt: 1 });

module.exports = mongoose.model('Voucher', VoucherSchema);
