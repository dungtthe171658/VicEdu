import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export const SECRET_KEY = process.env.SECRET_KEY as string;

export interface AuthRequest extends Request {
  user?: JwtPayload | string;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

export function checkRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ message: "Chưa xác thực" });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({
        message: "Không đủ quyền",
        requiredRoles: roles,
        currentRole: user.role,
      });
    }
    next();
  };
}
