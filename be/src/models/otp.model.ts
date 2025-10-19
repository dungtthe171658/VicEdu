import mongoose, { Schema, Document, Model } from "mongoose";

// Định nghĩa các loại và trạng thái OTP để dùng lại
export enum OtpType {
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
}

export enum OtpStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  EXPIRED = 'EXPIRED',
}

export interface IOtp extends Document {
  key: string; // ví dụ: "VERIFY_EMAIL-user@example.com"
  code: string;
  otp_type: OtpType;
  status: OtpStatus;
  attempts: number;
  max_attempts: number;
  expired_at: Date;
  metadata?: object | null;
}

const otpSchema = new Schema<IOtp>({
  key: { type: String, required: true, unique: true, index: true },
  code: { type: String, required: true },
  otp_type: { type: String, enum: Object.values(OtpType), required: true },
  status: { type: String, enum: Object.values(OtpStatus), default: OtpStatus.PENDING },
  attempts: { type: Number, default: 0 },
  max_attempts: { type: Number, default: 5 },
  expired_at: { type: Date, required: true, expires: 0 }, // Tự động xóa document khi hết hạn
  metadata: { type: Schema.Types.Mixed, default: null },
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  collection: 'otp_codes'
});

export default mongoose.model<IOtp>("OtpCode", otpSchema);