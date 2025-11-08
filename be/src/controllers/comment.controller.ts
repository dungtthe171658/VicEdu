import { Request, Response } from "express";
import mongoose from "mongoose";
import LessonCommentModel, { LessonCommentStatus } from "../models/comment.model";
import LessonModel from "../models/lesson.model";
import CourseModel from "../models/course.model";
import EnrollmentModel from "../models/enrollment.model";
import { AuthRequest } from "../middlewares/auth";

const isValidObjectId = (value: any) => {
  if (value == null) return false;
  try {
    return mongoose.Types.ObjectId.isValid(String(value));
  } catch {
    return false;
  }
};

const toObjectId = (value: any) => (isValidObjectId(value) ? new mongoose.Types.ObjectId(String(value)) : null);

const getUserId = (req: Request & { user?: any }): string | null => {
  const payload = req.user as any;
  if (!payload) return null;
  if (payload.id) return String(payload.id);
  if (payload._id) return String(payload._id);
  if (payload.userId) return String(payload.userId);
  return null;
};

const asUserSummary = (user: any) => {
  if (!user) return null;
  if (typeof user === "object") {
    return {
      _id: String(user._id ?? user.id),
      name: user.name || "",
      avatar: user.avatar,
      role: user.role,
    };
  }
  return { _id: String(user) };
};

const asLessonSummary = (lesson: any) => {
  if (!lesson) return null;
  if (typeof lesson === "object") {
    return {
      _id: String(lesson._id ?? lesson.id),
      title: lesson.title,
      position: typeof lesson.position === "number" ? lesson.position : undefined,
    };
  }
  return { _id: String(lesson) };
};

const asCourseSummary = (course: any) => {
  if (!course) return null;
  if (typeof course === "object") {
    return {
      _id: String(course._id ?? course.id),
      title: course.title,
      slug: course.slug,
    };
  }
  return { _id: String(course) };
};

type AccessResult = { allowed: boolean; isModerator: boolean };

const resolveCourseAccess = async (
  userId: mongoose.Types.ObjectId | null,
  role: string | undefined,
  courseId: mongoose.Types.ObjectId
): Promise<AccessResult> => {
  if (!userId) return { allowed: false, isModerator: false };
  if (role === "admin") {
    return { allowed: true, isModerator: true };
  }
  if (role === "teacher") {
    const ownsCourse = await CourseModel.exists({ _id: courseId, teacher: { $in: [userId] } });
    return { allowed: Boolean(ownsCourse), isModerator: Boolean(ownsCourse) };
  }
  const enrolled = await EnrollmentModel.exists({
    user_id: userId,
    course_id: courseId,
    status: { $ne: "cancelled" },
  });
  return { allowed: Boolean(enrolled), isModerator: false };
};

const buildReplyMap = (replies: any[]) => {
  const map = new Map<string, any[]>();
  replies.forEach((reply) => {
    const key = String(reply.root_id ?? reply.parent_id ?? reply._id);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push({
      ...reply,
      user: asUserSummary(reply.user_id),
    });
  });
  return map;
};

const sanitizeThread = (thread: any, replies: any[]) => ({
  ...thread,
  user: asUserSummary(thread.user_id),
  lesson: asLessonSummary(thread.lesson_id),
  course: asCourseSummary(thread.course_id),
  replies,
});

export const listLessonComments = async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;
    const lid = toObjectId(lessonId);
    if (!lid) return res.status(400).json({ message: "Invalid lessonId" });

    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "20"), 10) || 20, 1), 50);
    const cursorParam = typeof req.query.cursor === "string" ? req.query.cursor : null;
    const cursorDate = cursorParam ? new Date(cursorParam) : null;
    const statusParam = typeof req.query.status === "string" ? req.query.status : null;
    const statusFilter: LessonCommentStatus | undefined =
      statusParam && (["open", "resolved"] as LessonCommentStatus[]).includes(statusParam as LessonCommentStatus)
        ? (statusParam as LessonCommentStatus)
        : undefined;

    const query: Record<string, any> = { lesson_id: lid, parent_id: null };
    if (statusFilter) query.status = statusFilter;
    if (cursorDate && !Number.isNaN(cursorDate.valueOf())) {
      query.last_activity_at = { $lt: cursorDate };
    }

    const threads = await LessonCommentModel.find(query)
      .sort({ last_activity_at: -1, created_at: -1 })
      .limit(limit)
      .populate("user_id", "name avatar role")
      .populate("lesson_id", "title position")
      .populate("course_id", "title slug")
      .lean();

    const rootIds = threads.map((item) => item._id);
    const replies = rootIds.length
      ? await LessonCommentModel.find({ root_id: { $in: rootIds }, parent_id: { $ne: null } })
          .sort({ created_at: 1 })
          .populate("user_id", "name avatar role")
          .lean()
      : [];

    const replyMap = buildReplyMap(replies);
    const payload = threads.map((thread) => sanitizeThread(thread, replyMap.get(String(thread._id)) || []));
    const nextCursor =
      payload.length === limit ? new Date(payload[payload.length - 1].last_activity_at).toISOString() : null;

    return res.json({ data: payload, count: payload.length, nextCursor });
  } catch (error: any) {
    console.error("listLessonComments error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const createLessonComment = async (req: AuthRequest, res: Response) => {
  try {
    const { lesson_id, content, parent_id } = req.body || {};

    if (!lesson_id || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Lesson and content are required" });
    }

    const lessonObjectId = toObjectId(lesson_id);
    if (!lessonObjectId) return res.status(400).json({ message: "Invalid lesson_id" });

    const lesson = await LessonModel.findById(lessonObjectId).select("_id course_id title position").lean();
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const userIdRaw = getUserId(req);
    if (!userIdRaw) return res.status(401).json({ message: "Unauthenticated" });
    const userObjectId = new mongoose.Types.ObjectId(userIdRaw);
    const role = (req.user as any)?.role;

    const courseId = new mongoose.Types.ObjectId(String(lesson.course_id));

    const parentObjectId = parent_id ? toObjectId(parent_id) : null;
    let parentComment: any = null;
    if (parentObjectId) {
      parentComment = await LessonCommentModel.findById(parentObjectId).lean();
      if (!parentComment) return res.status(404).json({ message: "Parent comment not found" });
      if (String(parentComment.lesson_id) !== String(lesson._id)) {
        return res.status(400).json({ message: "Parent comment does not belong to this lesson" });
      }
    }

    const access = await resolveCourseAccess(userObjectId, role, courseId);
    if (!access.allowed) return res.status(403).json({ message: "You cannot comment on this lesson" });

    const now = new Date();
    const newId = new mongoose.Types.ObjectId();
    const rootId = parentComment ? parentComment.root_id ?? parentComment._id : newId;

    const created = await LessonCommentModel.create({
      _id: newId,
      course_id: courseId,
      lesson_id: lesson._id,
      user_id: userObjectId,
      parent_id: parentComment ? parentComment._id : null,
      root_id: rootId,
      content: content.trim(),
      status: parentComment ? parentComment.status : "open",
      last_activity_at: now,
      last_activity_by: userObjectId,
    });

    if (parentComment) {
      const inc: Record<string, number> = { reply_count: 1 };
      const set: Record<string, any> = {
        last_activity_at: now,
        last_activity_by: userObjectId,
      };
      if (access.isModerator) {
        inc.teacher_reply_count = 1;
        set.last_teacher_reply_at = now;
      }
      await LessonCommentModel.updateOne({ _id: rootId }, { $inc: inc, $set: set });
    }

    await (created as any).populate([{ path: "user_id", select: "name avatar role" }, { path: "lesson_id", select: "title position" }, { path: "course_id", select: "title slug" }]); return res.status(201).json(sanitizeThread((created as any).toObject(), []));
  } catch (error: any) {
    console.error("createLessonComment error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const listTeacherCommentThreads = async (req: AuthRequest, res: Response) => {
  try {
    const userIdRaw = getUserId(req);
    if (!userIdRaw) return res.status(401).json({ message: "Unauthenticated" });
    const role = (req.user as any)?.role;
    const userObjectId = new mongoose.Types.ObjectId(userIdRaw);

    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "20"), 10) || 20, 1), 50);
    const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
    const skip = (page - 1) * limit;

    let allowedCourseIds: mongoose.Types.ObjectId[] | null = null;
    if (role === "teacher") {
      const courses = await CourseModel.find({ teacher: userObjectId }).select("_id").lean();
      allowedCourseIds = courses.map((c) => c._id as mongoose.Types.ObjectId);
      if (!allowedCourseIds.length) {
        return res.json({ data: [], total: 0, page, limit });
      }
    }

    const query: Record<string, any> = { parent_id: null };
    if (allowedCourseIds) {
      query.course_id = { $in: allowedCourseIds };
    }

    if (typeof req.query.courseId === "string" && req.query.courseId.trim()) {
      const cid = toObjectId(req.query.courseId);
      if (!cid) return res.status(400).json({ message: "Invalid courseId" });
      if (allowedCourseIds && !allowedCourseIds.some((id) => id.equals(cid))) {
        return res.json({ data: [], total: 0, page, limit });
      }
      query.course_id = cid;
    }

    if (typeof req.query.lessonId === "string" && req.query.lessonId.trim()) {
      const lid = toObjectId(req.query.lessonId);
      if (!lid) return res.status(400).json({ message: "Invalid lessonId" });
      query.lesson_id = lid;
    }

    if (typeof req.query.status === "string" && ["open", "resolved"].includes(req.query.status)) {
      query.status = req.query.status;
    }

    if (String(req.query.onlyUnanswered) === "true") {
      query.teacher_reply_count = 0;
    }

    if (typeof req.query.search === "string" && req.query.search.trim()) {
      query.content = { $regex: req.query.search.trim(), $options: "i" };
    }

    const [threads, total] = await Promise.all([
      LessonCommentModel.find(query)
        .sort({ last_activity_at: -1, created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user_id", "name avatar role")
        .populate("lesson_id", "title position")
        .populate("course_id", "title slug")
        .lean(),
      LessonCommentModel.countDocuments(query),
    ]);

    const rootIds = threads.map((item) => item._id);
    const replies = rootIds.length
      ? await LessonCommentModel.find({ root_id: { $in: rootIds }, parent_id: { $ne: null } })
          .sort({ created_at: 1 })
          .populate("user_id", "name avatar role")
          .lean()
      : [];

    const replyMap = buildReplyMap(replies);
    const payload = threads.map((thread) => sanitizeThread(thread, replyMap.get(String(thread._id)) || []));

    return res.json({ data: payload, total, page, limit });
  } catch (error: any) {
    console.error("listTeacherCommentThreads error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const updateCommentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const status = req.body?.status;
    if (!["open", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const cid = toObjectId(commentId);
    if (!cid) return res.status(400).json({ message: "Invalid commentId" });

    const comment = await LessonCommentModel.findById(cid);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const rootId = comment.parent_id ? comment.root_id ?? comment.parent_id : comment._id;
    const rootComment = comment.parent_id ? await LessonCommentModel.findById(rootId) : comment;
    if (!rootComment) return res.status(404).json({ message: "Thread not found" });

    const userIdRaw = getUserId(req);
    if (!userIdRaw) return res.status(401).json({ message: "Unauthenticated" });
    const userObjectId = new mongoose.Types.ObjectId(userIdRaw);
    const role = (req.user as any)?.role;

    const access = await resolveCourseAccess(userObjectId, role, new mongoose.Types.ObjectId(String(rootComment.course_id)));
    if (!access.isModerator) return res.status(403).json({ message: "You cannot update this comment" });

    rootComment.status = status as LessonCommentStatus;
    if (status === "resolved") {
      rootComment.resolved_at = new Date();
      rootComment.resolved_by = userObjectId;
    } else {
      rootComment.resolved_at = null;
      rootComment.resolved_by = null;
    }

    await rootComment.save();
    await (rootComment as any).populate([{ path: "user_id", select: "name avatar role" }, { path: "lesson_id", select: "title position" }, { path: "course_id", select: "title slug" }]); return res.json(sanitizeThread((rootComment as any).toObject(), []));
  } catch (error: any) {
    console.error("updateCommentStatus error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export default {
  listLessonComments,
  createLessonComment,
  listTeacherCommentThreads,
  updateCommentStatus,
};




