import { Request, Response } from "express";
import User, { IUser } from "../models/user.model";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { JWT_SECRET } from "../middlewares/auth";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.APP_PASSWORD,
  },
});

// ====================== ĐĂNG KÝ ======================
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Thiếu thông tin" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email đã được sử dụng" });

    const hashed = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString("hex");

    const newUser = new User({
      name,
      email,
      password: hashed,
      phone,
      role,
      verifyToken,
      verifyTokenExpiry: new Date(Date.now() + 15 * 60 * 1000),
    });

    await newUser.save();

    const verifyUrl = `${process.env.FE_URL}/verify-email?token=${verifyToken}`;
    await transporter.sendMail({
      to: email,
      subject: "Xác minh email",
      html: `
        <h3>Chào ${name}</h3>
        <p>Nhấn vào liên kết sau để xác minh email của bạn:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
        <p>Liên kết hết hạn sau 15 phút.</p>
      `,
    });

    res.status(201).json({
      message: "Đăng ký thành công. Vui lòng kiểm tra email để xác minh.",
    });
  } catch (error: any) {
    console.error("Lỗi đăng ký:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// ====================== XÁC MINH EMAIL ======================
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Thiếu token" });

    const user = await User.findOne({
      verifyToken: token,
      verifyTokenExpiry: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });

    if (user.verifyTokenExpiry && user.verifyTokenExpiry < new Date()) {
      if(!user.is_verified) {
        await User.deleteOne({ _id: user._id });
        return res.status(400).json({ message: "Token đã hết hạn. Vui lòng đăng ký lại." });
      }
    }
    user.is_verified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiry = undefined;
    await user.save();

    res.json({ message: "Xác minh email thành công" });
  } catch (error: any) {
    console.error("Lỗi xác minh email:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// ====================== ĐĂNG NHẬP ======================
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    const user: IUser | null = await User.findOne({ email });
    console.log("User tìm thấy:", user);
    if (!user)
      return res.status(400).json({ message: "Tài khoản không tồn tại" });

    if (user.password === "google_oauth") {
      return res.status(400).json({ message: "Hãy đăng nhập bằng Google" });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Sai mật khẩu" });

    if (!user.is_verified)
      return res.status(400).json({ message: "Email chưa xác minh" });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// ====================== QUÊN MẬT KHẨU ======================
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Email không tồn tại" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.FE_URL}/reset-password/${resetToken}`;
    await transporter.sendMail({
      to: email,
      subject: "Đặt lại mật khẩu",
      html: `
        <h3>Xin chào ${user.name}</h3>
        <p>Nhấn vào liên kết sau để đặt lại mật khẩu:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Liên kết hết hạn sau 15 phút.</p>
      `,
    });

    res.json({ message: "Email đặt lại mật khẩu đã được gửi" });
  } catch (error: any) {
    console.error("Lỗi forgotPassword:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// ====================== ĐẶT LẠI MẬT KHẨU ======================
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user)
      return res.status(400).json({ message: "Token không hợp lệ hoặc hết hạn" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error: any) {
    console.error("Lỗi resetPassword:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// ====================== GOOGLE LOGIN SUCCESS ======================
export const googleSuccess = (req: Request, res: Response) => {
  const user = req.user as IUser;
  if (!user) return res.redirect(`${process.env.FE_URL}/login?error=google_failed`);

  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  const redirectUrl = `${process.env.FE_URL}/google-success?token=${token}`;
  res.redirect(redirectUrl);
};

// ====================== GOOGLE LOGIN FAILURE ======================
export const googleFailure = (_req: Request, res: Response) => {
  res.redirect(`${process.env.FE_URL}/login?error=google_failed`);
};

export default {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  googleSuccess,
  googleFailure,
};
