// src/controllers/auth.controller.ts

import { Response } from "express";
import UserModel from "../models/user.model";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middlewares/auth";
import { sendOtp, verifyOtp } from "./otp.controller";
import { OtpType } from "../models/otp.model";

// --- Helper Functions ---

/**
 * Tạo JWT token cho người dùng.
 */
const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};

// --- Controller Functions ---

/**
 * Đăng ký tài khoản mới.
 */
export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, email, password, phone, role } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ message: "Full name, email, and password are required." });
      return;
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: "Email is already registered." });
      return;
    }

    const newUser = new UserModel({ fullName, email, password, phone, role });
    await newUser.save();
    
    // TODO: Gửi email xác thực tài khoản (nếu cần)
    // await sendOtp(OtpType.VERIFY_EMAIL, newUser.email);

    const userResponse = newUser.toObject();
    // @ts-ignore
    delete userResponse.password;

    res.status(201).json({ 
      message: "User registered successfully. Please check your email to verify your account.", 
      user: userResponse 
    });
  } catch (error: any) {
    console.error("REGISTER_ERROR:", error);
    res.status(500).json({ message: "An unexpected error occurred during registration." });
  }
};

/**
 * Đăng nhập vào hệ thống.
 */
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required." });
      return;
    }

    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    // Kiểm tra trạng thái tài khoản
    if (!user.isActive) {
      res.status(403).json({ message: "Your account is deactivated. Please contact support." });
      return;
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      res.status(403).json({ 
        message: `Your account is temporarily locked. Please try again after ${user.lockedUntil.toLocaleString()}` 
      });
      return;
    }

    // So sánh mật khẩu
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }
    
    const token = generateToken(user._id.toString(), user.role);

    const userResponse = user.toObject();
    // @ts-ignore
    delete userResponse.password;

    res.status(200).json({
      message: "Login successful.",
      token,
      user: userResponse,
    });
  } catch (error: any) {
    console.error("LOGIN_ERROR:", error);
    res.status(500).json({ message: "An unexpected error occurred during login." });
  }
};

/**
 * Bắt đầu quy trình quên mật khẩu bằng cách gửi OTP.
 */
export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
          res.status(400).json({ message: "Email is required." });
          return;
        }

        const user = await UserModel.findOne({ email });
        if (user) {
            // Chỉ gửi OTP nếu người dùng tồn tại
            await sendOtp(OtpType.FORGOT_PASSWORD, email, "Reset Your Password OTP");
        }

        // Luôn trả về thông báo thành công để bảo mật, tránh việc dò email
        res.status(200).json({ message: "If an account with that email exists, a password reset OTP has been sent." });
    } catch (error: any) {
        console.error("FORGOT_PASSWORD_ERROR:", error);
        res.status(500).json({ message: "An unexpected error occurred." });
    }
};

/**
 * Hoàn tất quy trình đặt lại mật khẩu bằng OTP.
 */
export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email, code, newPassword } = req.body;
        if (!email || !code || !newPassword) {
            res.status(400).json({ message: "Email, OTP code, and new password are required." });
            return;
        }

        const verificationResult = await verifyOtp(OtpType.FORGOT_PASSWORD, email, code);
        
        if (verificationResult.status !== 'VALID') {
            res.status(400).json({ message: verificationResult.message });
            return;
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            // Trường hợp này rất hi hữu vì OTP đã được xác thực
            res.status(404).json({ message: "User not found." });
            return;
        }

        user.password = newPassword;
        await user.save(); // Hook pre-save sẽ tự động hash mật khẩu mới

        res.status(200).json({ message: "Your password has been reset successfully." });
    } catch (error: any) {
        console.error("RESET_PASSWORD_ERROR:", error);
        res.status(500).json({ message: "An unexpected error occurred while resetting the password." });
    }
};