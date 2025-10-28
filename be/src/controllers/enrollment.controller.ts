import { Request, Response } from "express";
import mongoose from "mongoose";
import EnrollmentModel from "../models/enrollment.model";
import OrderModel from "../models/order.model";
import UserModel from "../models/user.model";

// Align with getMyProfileFull: prefer req.user._id or req.user.id (as string)
function getUserIdFromToken(req: Request & { user?: any }): string | null {
  const u = (req as any).user as any;
  const id = u?._id?.toString?.() || u?.id?.toString?.();
  return id || null;
}


export const getMyEnrollMini = async (req: Request, res: Response) => {
  try {
    const uid = getUserIdFromToken(req);
    if (!uid) return res.status(401).json({ message: "Unauthenticated" });

    const userObjectId = new mongoose.Types.ObjectId(uid);

    // Truy vấn enrollments cơ bản
    const enrollments = await EnrollmentModel.find({ user_id: userObjectId })
      .select("_id course_id status") // chỉ lấy field cần thiết
      .lean();

    return res.json(enrollments);
  } catch (error: any) {
    console.error("getMyEnrollMini error:", error?.message || error);
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const getMyEnrollments = async (req: Request, res: Response) => {
  try {
    // Avoid caching for dynamic user-specific results
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");

    const isDev = (process.env.NODE_ENV || "development") !== "production";

    // Resolve user id from token first (same approach as getMyProfileFull)
    let uid = getUserIdFromToken(req);

    // Dev/debug: allow overriding target user via ?email=... when developing
    const qEmailRaw = (req.query as any)?.email;
    if (!uid && qEmailRaw && typeof qEmailRaw === "string" && isDev) {
      const qEmail = qEmailRaw.trim().toLowerCase();
      const userByEmail = await UserModel.findOne({ email: qEmail })
        .select({ _id: 1 })
        .lean();
      if (userByEmail?._id) uid = String((userByEmail as any)._id);
    }

    // Fallback: if token has email but not id, resolve by email
    if (!uid) {
      const tokenEmail = (req as any).user?.email as string | undefined;
      if (tokenEmail) {
        const userByTokenEmail = await UserModel.findOne({ email: tokenEmail })
          .select({ _id: 1 })
          .lean();
        if (userByTokenEmail?._id) uid = String((userByTokenEmail as any)._id);
      }
    }

    if (!uid) return res.status(401).json({ message: "Unauthenticated" });

    const userObjectId = new mongoose.Types.ObjectId(uid);

    // 1) Lấy từ bảng enrollments (nếu đã có bản ghi ghi danh)
    const enrollments = await EnrollmentModel.find({ user_id: userObjectId })
      .populate({ path: "course_id", model: "Course" })
      .sort({ created_at: -1 })
      .lean();

    const coursesMap = new Map<string, any>();
    for (const e of enrollments as any[]) {
      if (e?.course_id?._id) {
        coursesMap.set(String(e.course_id._id), e.course_id);
      }
    }

    // 2) Bổ sung từ bảng orders + order_items (đối chiếu product_id -> courses)
    const includePending = String((req.query as any)?.includePending || "0") === "1";
    const statuses = includePending && isDev ? ["completed", "pending"] : ["completed"];
    const viaOrders = await OrderModel.aggregate([
      { $match: { user_id: userObjectId, status: { $in: statuses } } },
      {
        $lookup: {
          from: "order_items",
          localField: "_id",
          foreignField: "order_id",
          as: "items",
        },
      },
      { $unwind: "$items" },
      { $match: { "items.product_type": "Course" } },
      {
        $lookup: {
          from: "courses",
          localField: "items.product_id",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $group: {
          _id: "$course._id",
          course: { $first: "$course" },
          lastPurchasedAt: { $max: "$created_at" },
        },
      },
      { $sort: { lastPurchasedAt: -1 } },
    ]);

    for (const row of viaOrders as any[]) {
      if (row?.course?._id) {
        const id = String(row.course._id);
        if (!coursesMap.has(id)) coursesMap.set(id, row.course);
      }
    }

    const data = Array.from(coursesMap.values()).map((c: any) => ({
      _id: c._id,
      course: c,
    }));

    return res.json(data);
  } catch (error: any) {
    console.error("getMyEnrollments error:", error?.message || error);
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export default { getMyEnrollments };
