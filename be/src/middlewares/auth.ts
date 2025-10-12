// src/middlewares/auth.ts

import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import UserModel, { IUser } from "../models/user.model";

/**
 * Mở rộng interface Request của Express để thêm thuộc tính 'user'.
 * Điều này giúp TypeScript nhận biết req.user trong toàn bộ ứng dụng.
 */
export interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * Middleware để xác thực JWT token từ header 'Authorization'.
 * Nếu hợp lệ, nó sẽ tìm người dùng tương ứng và gắn vào `req.user`.
 */
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access Denied. No token provided." });
    }
  
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    
    // Tìm người dùng trong DB, đảm bảo người dùng chưa bị soft-delete
    // @ts-ignore: Method from mongoose-delete
    const user = await UserModel.findOne({ _id: decoded.userId, deleted: false });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized. User for this token not found." });
    }

    // Gắn thông tin người dùng vào request để các hàm controller sau có thể sử dụng
    req.user = user;
    next(); // Chuyển sang middleware hoặc controller tiếp theo
  } catch (error) {
    // Xử lý các lỗi của JWT như token hết hạn, không hợp lệ...
    return res.status(403).json({ message: "Forbidden. Invalid or expired token." });
  }
};

/**
 * Middleware factory để kiểm tra vai trò (role) của người dùng.
 * Phải được sử dụng SAU `authenticateToken`.
 * @param allowedRoles - Mảng các vai trò được phép truy cập.
 */
export const checkRole = (allowedRoles: Array<'customer' | 'teacher' | 'admin'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication error. User context is missing." });
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: "Forbidden. You do not have permission to access this resource.",
        requiredRoles: allowedRoles,
        yourRole: userRole
      });
    }
    
    next(); // Vai trò hợp lệ, cho phép truy cập
  };
};