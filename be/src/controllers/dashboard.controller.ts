import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/auth";
import UserModel from "../models/user.model";
import OrderModel from "../models/order.model";
import CourseModel from "../models/course.model";
import OrderItemModel from "../models/order_item.model";
import ReviewModel from "../models/review.model";

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

// GET /api/dashboard/teacher
// Returns revenue and unique student count for the authenticated teacher
export const getTeacherStats = async (req: AuthRequest, res: Response) => {
  try {
    const user: any = req.user || {};
    const uid = user?._id?.toString?.() || user?.id?.toString?.();
    if (!uid) return res.status(401).json({ message: "Unauthenticated" });

    const teacherObjectId = new mongoose.Types.ObjectId(uid);

    // 1) Courses owned by this teacher
    const courses = await CourseModel.find({ teacher: { $in: [teacherObjectId] } })
      .select("_id is_published status")
      .lean();

    const courseIds = courses.map((c: any) => c._id);
    const activeCourses = courses.filter((c: any) => Boolean(c.is_published) || c.status === 'approved').length;

    if (courseIds.length === 0) {
      return res.json({ students: 0, revenue: 0, activeCourses });
    }

    // 2) Aggregate order items for these courses with completed orders
    const agg = await OrderItemModel.aggregate([
      { $match: { product_type: "Course", product_id: { $in: courseIds } } },
      { $lookup: { from: "orders", localField: "order_id", foreignField: "_id", as: "order" } },
      { $unwind: "$order" },
      { $match: { "order.status": "completed" } },
      {
        $group: {
          _id: "$order.user_id",
          spent: { $sum: { $multiply: ["$price_at_purchase", "$quantity"] } },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$spent" },
          students: { $sum: 1 },
        },
      },
      { $project: { _id: 0, revenue: 1, students: 1 } },
    ]);

    const revenue = agg?.[0]?.revenue || 0;
    const students = agg?.[0]?.students || 0;

    return res.json({ students, revenue, activeCourses });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const getAdminActiveCourseCount = async (_req: AuthRequest, res: Response) => {
  try {
    const count = await CourseModel.countDocuments({ is_published: true });
    return res.status(200).json({ count });
  } catch (error: any) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const getAdminReviewCount = async (_req: AuthRequest, res: Response) => {
  try {
    const count = await ReviewModel.countDocuments();
    return res.status(200).json({ count });
  } catch (error: any) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};
