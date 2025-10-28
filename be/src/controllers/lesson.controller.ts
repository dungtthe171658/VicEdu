// src/controllers/lesson.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import LessonModel from "../models/lesson.model";
import CourseModel from "../models/course.model";
import EnrollmentModel from "../models/enrollment.model";
import { AuthRequest } from "../middlewares/auth";

// -------------------------------
// Helpers
// -------------------------------
const isValidObjectId = (id: any) => mongoose.Types.ObjectId.isValid(id);
const toObjectId = (id: any) =>
  isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null;

function getUserId(req: Request & { user?: any; userId?: any; user_id?: any }): string | null {
  if (req.user?.id) return String(req.user.id);
  if (req.user?._id) return String(req.user._id);
  if (req.userId) return String(req.userId);
  if (req.user_id) return String(req.user_id);
  return null;
}

/**
 * Ký CloudFront URL nếu đã cấu hình KEY_PAIR_ID + PRIVATE_KEY_B64
 * Nếu chưa cấu hình, trả luôn rawUrl (để dev/test).
 */
function signCloudFrontUrlOrReturnRaw(rawUrl: string, ttlSeconds = 1800): string {
  const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
  const privateKeyB64 = process.env.CLOUDFRONT_PRIVATE_KEY_B64;
  if (!keyPairId || !privateKeyB64) return rawUrl;

  const privateKeyPem = Buffer.from(privateKeyB64, "base64").toString("utf8");
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;

  const policyObj = {
    Statement: [
      {
        Resource: rawUrl,
        Condition: { DateLessThan: { "AWS:EpochTime": expires } },
      },
    ],
  };
  const policy = JSON.stringify(policyObj);
  const policyB64 = Buffer.from(policy)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/=/g, "_")
    .replace(/\//g, "~");

  const signer = crypto.createSign("RSA-SHA1");
  signer.update(policy);
  const signature = signer
    .sign(privateKeyPem, "base64")
    .replace(/\+/g, "-")
    .replace(/=/g, "_")
    .replace(/\//g, "~");

  return `${rawUrl}?Policy=${policyB64}&Signature=${signature}&Key-Pair-Id=${keyPairId}`;
}

// -------------------------------
// Controllers
// -------------------------------

/**
 * GET /api/courses/:courseId/lessons
 * Lấy danh sách lesson trong 1 course
 */
export const getLessonsOfCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const cid = toObjectId(courseId);
    if (!cid) return res.status(400).json({ message: "Invalid courseId" });

    const lessons = await LessonModel.find({ course_id: cid })
      .sort({ position: 1, createdAt: 1 })
      .lean();

    return res.json(lessons);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

/**
 * GET /api/lessons/:lessonId
 * Lấy chi tiết một lesson
 */
export const getLessonById = async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;
    const lid = toObjectId(lessonId);
    if (!lid) return res.status(400).json({ message: "Invalid lessonId" });

    const lesson = await LessonModel.findById(lid).lean();
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    return res.json(lesson);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

/**
 * POST /api/courses/:courseId/lessons
 * Tạo lesson mới (teacher)
 * Body: { title: string, video_url?: string, duration_minutes?: number }
 */
export const createLesson = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const { title, video_url, duration_minutes, description } = req.body as {
      title: string;
      video_url?: string;
      duration_minutes?: number;
      description?: string;
    };

    const cid = toObjectId(courseId);
    if (!cid) return res.status(400).json({ message: "Invalid courseId" });

    const course = await CourseModel.findById(cid);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // (Tùy chọn) Kiểm tra quyền sở hữu khoá học:
    // if (String(course.teacher) !== String(req.user?._id)) {
    //   return res.status(403).json({ message: "You are not the owner of this course" });
    // }

    // Tính position dựa trên số lượng lesson hiện có
    const position = Array.isArray(course.lessons) ? course.lessons.length + 1 : 1;

    const newLesson = await LessonModel.create({
      title,
      video_url,
      duration_minutes: Number(duration_minutes || 0),
      course_id: cid,
      position,
      description,
    });

    // Đẩy vào mảng lessons của course
    (course.lessons as any[]).push(newLesson._id);
    await course.save();

    return res.status(201).json(newLesson);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

/**
 * PUT /api/lessons/:lessonId
 * Cập nhật lesson (title, video_url, duration_minutes, position)
 */
export const updateLesson = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId } = req.params;
    const lid = toObjectId(lessonId);
    if (!lid) return res.status(400).json({ message: "Invalid lessonId" });

    const payload: any = {};
    const { title, video_url, duration_minutes, position, description } = req.body;
    if (title !== undefined) payload.title = title;
    if (video_url !== undefined) payload.video_url = video_url;
    if (duration_minutes !== undefined) payload.duration_minutes = Number(duration_minutes);
    if (position !== undefined) payload.position = Number(position);
    if (description !== undefined) payload.description = description;

    const updated = await LessonModel.findByIdAndUpdate(lid, payload, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Lesson not found" });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

/**
 * DELETE /api/lessons/:lessonId
 * Xoá lesson và kéo ra khỏi course.lessons
 */
export const deleteLesson = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId } = req.params;
    const lid = toObjectId(lessonId);
    if (!lid) return res.status(400).json({ message: "Invalid lessonId" });

    const lesson = await LessonModel.findById(lid);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    // Xoá lesson
    await LessonModel.deleteOne({ _id: lid });

    // Gỡ khỏi course.lessons
    await CourseModel.updateOne(
      { _id: lesson.course_id },
      { $pull: { lessons: lid } }
    );

    return res.json({ message: "Lesson deleted" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

/**
 * GET /api/lessons/:lessonId/playback
 * Trả về URL phát video cho học viên đã enroll
 * - Nếu bạn đã thêm các field HLS như playback_url/status: sẽ ưu tiên playback_url & check status==='ready'
 * - Nếu chưa, sẽ fallback dùng lesson.video_url
 */
export const getLessonPlayback = async (req: AuthRequest, res: Response) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ message: "Unauthenticated" });

    const { lessonId } = req.params;
    const lid = toObjectId(lessonId);
    if (!lid) return res.status(400).json({ message: "Invalid lessonId" });

    const lesson = await LessonModel.findById(lid).lean();
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    // Nếu sau này bạn thêm status/playback_url, có thể bật check dưới:
    // if ((lesson as any).status && (lesson as any).status !== "ready") {
    //   return res.status(409).json({ message: "Lesson is not ready yet" });
    // }

    // Chỉ cho xem nếu user đã enroll
    const enrolled = await EnrollmentModel.exists({
      user_id: new mongoose.Types.ObjectId(uid),
      course_id: new mongoose.Types.ObjectId(lesson.course_id),
    });
    if (!enrolled) return res.status(403).json({ message: "You have no access to this lesson" });

    // Ưu tiên HLS nếu đã có; nếu chưa thì dùng video_url thuần
    const rawPlayback =
      (lesson as any).playback_url /* HLS qua CloudFront nếu đã thiết lập */ ||
      (lesson as any).video_url;   /* video mp4/url cũ */

    if (!rawPlayback) return res.status(404).json({ message: "No playback URL" });

    const playbackUrl = signCloudFrontUrlOrReturnRaw(rawPlayback, 30 * 60); // 30 phút
    return res.json({ playbackUrl, expiresIn: 1800 });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export default {
  getLessonsOfCourse,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  getLessonPlayback,
};
