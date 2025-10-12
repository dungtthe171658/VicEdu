import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth"; // Đảm bảo import đúng đường dẫn
import UserModel from "../models/user.model";
import { isValidObjectId } from "mongoose";

/**
 * [Admin] Lấy danh sách tất cả người dùng (bao gồm cả user đã bị xóa mềm).
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore: Dùng withDeleted() từ plugin mongoose-delete
    const users = await UserModel.findWithDeleted({});
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

/**
 * Lấy thông tin cá nhân của người dùng đang đăng nhập.
 */
export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    res.status(200).json(req.user);
};

/**
 * [Admin] Lấy thông tin một người dùng theo ID.
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid user ID format." });
        }
        // @ts-ignore
        const user = await UserModel.findOneWithDeleted({ _id: id });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json(user);
    } catch (error: any) {
        res.status(500).json({ message: "Server error." });
    }
};

/**
 * [Admin] Cập nhật thông tin người dùng (tên, sđt, vai trò, trạng thái active).
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { fullName, phone, role, isActive } = req.body;
        
        const updatedUser = await UserModel.findByIdAndUpdate(id, 
            { fullName, phone, role, isActive }, 
            { new: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json({ message: "User updated successfully.", user: updatedUser });
    } catch (error: any) {
        res.status(500).json({ message: "Server error." });
    }
};

/**
 * [Admin] Khóa tài khoản trong một khoảng thời gian.
 */
export const lockUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { hours } = req.body;
        if (!hours || isNaN(hours) || hours <= 0) {
            return res.status(400).json({ message: "Invalid lock duration in hours." });
        }

        const lockedUntil = new Date();
        lockedUntil.setHours(lockedUntil.getHours() + Number(hours));

        const user = await UserModel.findByIdAndUpdate(id, { lockedUntil }, { new: true });
        if (!user) return res.status(404).json({ message: "User not found." });

        res.status(200).json({ message: `User locked until ${lockedUntil.toLocaleString()}`, user });
    } catch (error: any) {
        res.status(500).json({ message: "Server error." });
    }
};

/**
 * [Admin] Mở khóa tài khoản ngay lập tức.
 */
export const unlockUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = await UserModel.findByIdAndUpdate(id, { lockedUntil: null }, { new: true });
        if (!user) return res.status(404).json({ message: "User not found." });
        res.status(200).json({ message: "User unlocked successfully.", user });
    } catch (error: any) {
        res.status(500).json({ message: "Server error." });
    }
};

/**
 * [Admin] Xóa mềm người dùng.
 */
export const softDeleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const result = await UserModel.delete({ _id: id });
        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "User not found or already deleted." });
        }
        res.status(200).json({ message: "User soft-deleted successfully." });
    } catch (error: any) {
        res.status(500).json({ message: "Server error." });
    }
};

/**
 * [Admin] Khôi phục người dùng đã xóa mềm.
 */
export const restoreUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const result = await UserModel.restore({ _id: id });
        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "User not found or not deleted." });
        }
        res.status(200).json({ message: "User restored successfully." });
    } catch (error: any) {
        res.status(500).json({ message: "Server error." });
    }
};