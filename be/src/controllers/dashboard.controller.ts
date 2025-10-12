import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import UserModel from "../models/user.model";
import OrderModel from "../models/order.model";

export const getAdminStats = async (req: AuthRequest, res: Response) => {
    try {
        const totalUsers = await UserModel.countDocuments();
        const totalOrders = await OrderModel.countDocuments({ status: 'completed' });
        const revenueResult = await OrderModel.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$total_amount' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
        
        res.status(200).json({ totalUsers, totalOrders, totalRevenue });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};