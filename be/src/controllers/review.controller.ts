import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import ReviewModel from "../models/review.model";
import EnrollmentModel from "../models/enrollment.model";
import mongoose from "mongoose";

// Resolve user id from token (align with enrollment controller)
function getUserIdFromToken(req: AuthRequest & { user?: any }): string | null {
  const u = (req as any).user as any;
  const id = u?._id?.toString?.() || u?.id?.toString?.();
  return id || null;
}

// User tạo review
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { product_id, product_type, rating, comment } = req.body || {};
    const uid = getUserIdFromToken(req);
    if (!uid) return res.status(401).json({ message: "Unauthenticated" });

    // Eligibility: only enrolled users can review Course
    if (product_type === "Course") {
      try {
        const userObjectId = new mongoose.Types.ObjectId(uid);
        const productObjectId = new mongoose.Types.ObjectId(String(product_id));
        const enrolled = await EnrollmentModel.findOne({
          user_id: userObjectId,
          course_id: productObjectId,
          status: "active",
        }).lean();
        if (!enrolled) {
          return res.status(403).json({ message: "Not eligible to review this course" });
        }
      } catch (e) {
        return res.status(400).json({ message: "Invalid product_id" });
      }
    }

    const payload: any = {
      user_id: uid,
      product_id,
      product_type,
      rating,
    };
    if (typeof comment === "string" && comment.trim()) payload.comment = comment.trim();

    const newReview = await ReviewModel.create(payload);
    res.status(201).json(newReview);
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error" });
  }
};

// Public list with filters (approved only)
export const getPublicReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { product_type, product_id, category_id } = (req.query || {}) as any;
    const page = Math.max(1, Number((req.query as any).page) || 1);
    const limit = Math.min(100, Math.max(1, Number((req.query as any).limit) || 20));
    const skip = (page - 1) * limit;

    const match: any = { status: "approved" };
    if (product_type && typeof product_type === "string") match.product_type = product_type;
    if (product_id && typeof product_id === "string" && product_id.trim()) {
      try { match.product_id = new mongoose.Types.ObjectId(product_id); } catch { /* ignore */ }
    }

    const needsCourseJoin = (category_id && String(category_id).trim()) || match.product_type === "Course";
    let pipeline: any[] = [{ $match: match }];

    if (needsCourseJoin) {
      pipeline.push(
        { $lookup: { from: "courses", localField: "product_id", foreignField: "_id", as: "course" } },
        { $unwind: "$course" }
      );
      if (category_id && typeof category_id === "string" && category_id.trim()) {
        let catObjId: any = null;
        try { catObjId = new mongoose.Types.ObjectId(category_id); } catch { /* ignore */ }
        if (catObjId) {
          pipeline.push({
            $match: {
              $or: [
                { "course.category": catObjId },
                { "course.category": { $elemMatch: { $eq: catObjId } } },
              ],
            },
          });
        }
      }

      // Annotate verified (has active enrollment)
      pipeline.push(
        {
          $lookup: {
            from: "enrollments",
            let: { courseId: "$product_id", reviewerId: "$user_id" },
            pipeline: [
              { $match: { $expr: { $and: [ { $eq: ["$course_id", "$$courseId"] }, { $eq: ["$user_id", "$$reviewerId"] }, { $eq: ["$status", "active"] } ] } } },
              { $limit: 1 },
            ],
            as: "verify_enroll",
          },
        },
        { $addFields: { verified: { $gt: [ { $size: "$verify_enroll" }, 0 ] } } },
        { $project: { verify_enroll: 0 } }
      );
    }

    // Populate user and (optional) product title
    pipeline.push(
      { $sort: { created_at: -1 } },
      { $skip: skip },
      { $limit: limit }
    );

    const rows = await ReviewModel.aggregate(pipeline);
    return res.json(rows);
  } catch (error: any) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

// Public summary for a product (approved only)
export const getPublicSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { product_type, product_id } = (req.query || {}) as any;
    if (!product_type || !product_id) return res.status(400).json({ message: "product_type and product_id are required" });
    let pid: any;
    try { pid = new mongoose.Types.ObjectId(product_id); } catch { return res.status(400).json({ message: "Invalid product_id" }); }

    const pipeline = [
      { $match: { status: "approved", product_type, product_id: pid } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ];
    const docs = await ReviewModel.aggregate(pipeline);
    const breakdown: Record<string, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as any;
    let total = 0;
    let sum = 0;
    for (const d of docs) {
      const r = Number(d._id) || 0;
      const c = Number(d.count) || 0;
      if (r >= 1 && r <= 5) breakdown[r] = c;
      total += c;
      sum += r * c;
    }
    const average = total ? Math.round((sum / total) * 10) / 10 : 0;
    return res.json({ count: total, average, breakdown });
  } catch (error: any) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

// Admin approve review
export const approveReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const review = await ReviewModel.findByIdAndUpdate(id, { status: "approved" }, { new: true });
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.status(200).json(review);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get tất cả reviews
export const getAllReviews = async (req: AuthRequest, res: Response) => {
  try {
    const q: any = req.query || {};
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const skip = (page - 1) * limit;

    const match: any = {};
    const { status, product_type, product_id, category_id } = q as any;
    if (status && status !== "all" && ["pending", "approved"].includes(String(status))) match.status = String(status);
    if (product_type && typeof product_type === "string") match.product_type = product_type;
    if (product_id && typeof product_id === "string" && product_id.trim()) {
      try { match.product_id = new mongoose.Types.ObjectId(product_id); } catch { /* ignore invalid */ }
    }

    const needsCourseJoin = (category_id && String(category_id).trim()) || match.product_type === "Course";

    const base: any[] = [{ $match: match }];

    if (needsCourseJoin) {
      base.push(
        { $lookup: { from: "courses", localField: "product_id", foreignField: "_id", as: "course" } },
        { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } }
      );
      if (category_id && typeof category_id === "string" && category_id.trim()) {
        try {
          const catObj = new mongoose.Types.ObjectId(category_id);
          base.push({ $match: { $or: [ { "course.category": catObj }, { "course.category": { $elemMatch: { $eq: catObj } } } ] } });
        } catch {
          // ignore invalid category id
        }
      }
    }

    // Join user for admin list
    base.push(
      { $lookup: { from: "users", localField: "user_id", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $sort: { created_at: -1 } },
      {
        $project: {
          _id: 1,
          product_id: 1,
          product_type: 1,
          rating: 1,
          comment: 1,
          status: 1,
          created_at: 1,
          user_id: "$user", // populated user object for FE
          course: "$course", // populated course object when available
        },
      },
      {
        $facet: {
          items: [ { $skip: skip }, { $limit: limit } ],
          total: [ { $count: "count" } ],
        },
      }
    );

    const agg = await ReviewModel.aggregate(base);
    const items = agg?.[0]?.items ?? [];
    const total = agg?.[0]?.total?.[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return res.json({ items, page, limit, total, totalPages });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error" });
  }
};

// Admin xóa review
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await ReviewModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Xóa đánh giá thành công" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
