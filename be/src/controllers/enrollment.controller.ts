import { Request, Response } from "express";
import mongoose from "mongoose";
import EnrollmentModel from "../models/enrollment.model";
import OrderModel from "../models/order.model";
import UserModel from "../models/user.model";
import LessonModel from "../models/lesson.model";

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

// Get enrollment for a specific course with completed_lessons
export const getEnrollmentByCourse = async (req: Request, res: Response) => {
  try {
    const uid = getUserIdFromToken(req);
    if (!uid) return res.status(401).json({ message: "Unauthenticated" });

    const { courseId } = req.params;
    if (!courseId || !mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid courseId" });
    }

    const userObjectId = new mongoose.Types.ObjectId(uid);
    const courseObjectId = new mongoose.Types.ObjectId(courseId);

    const enrollment = await EnrollmentModel.findOne({
      user_id: userObjectId,
      course_id: courseObjectId,
    })
      .select("_id course_id status completed_lessons progress")
      .lean();

    if (!enrollment) {
      return res.json({
        _id: null,
        course_id: courseId,
        status: "pending",
        completed_lessons: [],
        progress: 0,
      });
    }

    return res.json({
      _id: enrollment._id,
      course_id: enrollment.course_id,
      status: enrollment.status,
      completed_lessons: enrollment.completed_lessons || [],
      progress: enrollment.progress || 0,
    });
  } catch (error: any) {
    console.error("getEnrollmentByCourse error:", error?.message || error);
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

// Mark a lesson as completed
export const completeLesson = async (req: Request, res: Response) => {
  try {
    const uid = getUserIdFromToken(req);
    if (!uid) return res.status(401).json({ message: "Unauthenticated" });

    const { lessonId } = req.body;
    if (!lessonId || !mongoose.isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid lessonId" });
    }

    // Get lesson to find course_id
    const lesson = await LessonModel.findById(lessonId).select("course_id").lean();
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const userObjectId = new mongoose.Types.ObjectId(uid);
    const courseObjectId = new mongoose.Types.ObjectId(lesson.course_id);
    const lessonObjectId = new mongoose.Types.ObjectId(lessonId);

    // Find or create enrollment
    let enrollment = await EnrollmentModel.findOne({
      user_id: userObjectId,
      course_id: courseObjectId,
    });

    if (!enrollment) {
      // Create enrollment if it doesn't exist
      enrollment = await EnrollmentModel.create({
        user_id: userObjectId,
        course_id: courseObjectId,
        status: "active",
        progress: 0,
        completed_lessons: [],
      });
    }

    // Add lesson to completed_lessons if not already there
    if (!enrollment.completed_lessons.some((id) => id.toString() === lessonId)) {
      enrollment.completed_lessons.push(lessonObjectId);

      // Calculate progress: completed_lessons / total_lessons * 100
      const totalLessons = await LessonModel.countDocuments({ course_id: courseObjectId });
      if (totalLessons > 0) {
        enrollment.progress = Math.round((enrollment.completed_lessons.length / totalLessons) * 100);
      }

      await enrollment.save();
    }

    return res.json({
      message: "Lesson marked as completed",
      completed_lessons: enrollment.completed_lessons,
      progress: enrollment.progress,
    });
  } catch (error: any) {
    console.error("completeLesson error:", error?.message || error);
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

// [Admin] Get all enrollments with user and course data
export const getAllEnrollmentsForAdmin = async (req: Request, res: Response) => {
  try {
    const enrollments = await EnrollmentModel.find()
      .populate({ path: "user_id", model: "User", select: "name email role" })
      .populate({ path: "course_id", model: "Course", select: "title slug" })
      .sort({ created_at: -1 })
      .lean();

    return res.json(enrollments);
  } catch (error: any) {
    console.error("getAllEnrollmentsForAdmin error:", error?.message || error);
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

// [Teacher] Get enrollments by course IDs
export const getEnrollmentsByCoursesForTeacher = async (req: Request, res: Response) => {
  try {
    const uid = getUserIdFromToken(req);
    if (!uid) return res.status(401).json({ message: "Unauthenticated" });

    const { courseIds } = req.query;
    if (!courseIds) {
      return res.status(400).json({ message: "courseIds query parameter is required" });
    }

    // Parse courseIds - can be comma-separated string or array
    let courseIdArray: string[] = [];
    if (typeof courseIds === "string") {
      courseIdArray = courseIds.split(",").map((id) => id.trim());
    } else if (Array.isArray(courseIds)) {
      courseIdArray = courseIds.map((id) => String(id));
    }

    // Validate ObjectIds
    const validCourseIds = courseIdArray
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (validCourseIds.length === 0) {
      return res.json([]);
    }

    // Get enrollments for these courses
    const enrollments = await EnrollmentModel.find({
      course_id: { $in: validCourseIds },
    })
      .populate({ path: "user_id", model: "User", select: "name email role" })
      .populate({ path: "course_id", model: "Course", select: "title slug teacher" })
      .sort({ created_at: -1 })
      .lean();

    // Filter to only include courses owned by the teacher
    const teacherObjectId = new mongoose.Types.ObjectId(uid);
    const filteredEnrollments = enrollments.filter((enrollment: any) => {
      const course = enrollment.course_id;
      if (!course) return false;
      
      // Check if teacher matches
      if (course.teacher) {
        const teacherId = course.teacher._id || course.teacher;
        return String(teacherId) === uid;
      }
      return false;
    });

    return res.json(filteredEnrollments);
  } catch (error: any) {
    console.error("getEnrollmentsByCoursesForTeacher error:", error?.message || error);
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export default { getMyEnrollments };
