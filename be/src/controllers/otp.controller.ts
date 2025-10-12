// src/controllers/otp.controller.ts

import OtpModel, { OtpType, OtpStatus } from "../models/otp.model";
// import { EmailService } from '../services/email.service'; // Giả sử bạn có service gửi mail

const OTP_TTL_MINUTES = 5; // OTP hết hạn sau 5 phút

export class OTPController {
  /**
   * Gửi mã OTP đến email.
   * @param otpType Loại OTP (VERIFY_EMAIL, FORGOT_PASSWORD)
   * @param email Email người nhận
   */
  static async sendOtp(otpType: OtpType, email: string) {
    const emailLower = email.toLowerCase().trim();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `${otpType}-${emailLower}`;
    const expired_at = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await OtpModel.findOneAndUpdate(
      { key },
      {
        key,
        code,
        otp_type: otpType,
        status: OtpStatus.PENDING,
        attempts: 0,
        expired_at,
      },
      { upsert: true, new: true }
    );

    // TODO: Tích hợp logic gửi email thực tế ở đây
    console.log(`[OTP SENT] to ${emailLower} | Code: ${code}`);
    // await EmailService.send(emailLower, `Your OTP is ${code}`);

    return true;
  }

  /**
   * Xác thực mã OTP.
   * @param otpType Loại OTP
   * @param email Email
   * @param code Mã OTP người dùng nhập
   */
  static async verify_otp(
    otpType: OtpType,
    email: string,
    code: string
  ): Promise<boolean> {
    const emailLower = email.toLowerCase().trim();
    const key = `${otpType}-${emailLower}`;
    const rec = await OtpModel.findOne({ key });

    if (!rec) {
      throw new Error("OTP_NOT_FOUND");
    }
    if (rec.status === OtpStatus.CONFIRMED) {
      // Nếu đã confirm rồi thì coi như thành công, tránh user bị lỗi không cần thiết
      return true;
    }
    if (rec.expired_at.getTime() < Date.now()) {
      await rec.updateOne({ status: OtpStatus.EXPIRED });
      throw new Error("OTP_EXPIRED");
    }
    if (rec.attempts >= rec.max_attempts) {
      throw new Error("OTP_TOO_MANY_ATTEMPTS");
    }
    if (rec.code !== String(code)) {
      await rec.updateOne({ $inc: { attempts: 1 } });
      throw new Error("OTP_INVALID_CODE");
    }

    // OTP hợp lệ, cập nhật trạng thái
    // Thay vì xóa ngay, ta có thể đánh dấu là đã xác nhận
    await rec.updateOne({ status: OtpStatus.CONFIRMED });
    return true;
  }

  /**
   * Xóa OTP đã được sử dụng (ví dụ sau khi hoàn tất đăng ký/đổi mật khẩu).
   */
  static async deleteOtp(otpType: OtpType, email: string) {
    const emailLower = email.toLowerCase().trim();
    const key = `${otpType}-${emailLower}`;
    await OtpModel.deleteOne({ key });
  }
}
