// src/controllers/lesson.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import LessonModel from "../models/lesson.model";
import UserModel from "../models/user.model";
import { SendEmail } from "../utils/send-email";
import { config } from "../config/config";
import CourseModel from "../models/course.model";
import EnrollmentModel from "../models/enrollment.model";
import { AuthRequest } from "../middlewares/auth";
import EditHistory from "../models/editHistory.model";

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

function buildChanges(before: any, after: any, keys: string[]) {
  const changes: Record<string, { from: any; to: any }> = {};
  for (const k of keys) {
    const b = (before as any)?.[k];
    const a = (after as any)?.[k];
    const eq = JSON.stringify(b) === JSON.stringify(a);
    if (!eq) changes[k] = { from: b, to: a };
  }
  return changes;
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
    const { title, video_url, duration_minutes, description, storage_provider, storage_bucket, storage_path, playback_url } = req.body as {
      title: string;
      video_url?: string;
      duration_minutes?: number;
      description?: string;
      storage_provider?: string;
      storage_bucket?: string;
      storage_path?: string;
      playback_url?: string;
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
      storage_provider,
      storage_bucket,
      storage_path,
      playback_url,
    });

    // Đẩy vào mảng lessons của course
    (course.lessons as any[]).push(newLesson._id);
    await course.save();

    try {
      await EditHistory.create({
        target_type: 'lesson',
        target_id: newLesson._id,
        submitted_by: new mongoose.Types.ObjectId(String(getUserId(req) || '000000000000000000000000')),
        submitted_role: ((req.user as any)?.role === 'teacher') ? 'teacher' : 'system',
        status: 'applied',
        before: {},
        after: { title, video_url, duration_minutes: Number(duration_minutes || 0), description, storage_provider, storage_bucket, storage_path, playback_url },
        changes: { title: { from: undefined, to: title } },
      });
    } catch {}
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

    const { title, video_url, duration_minutes, position, description, storage_provider, storage_bucket, storage_path, playback_url } = req.body as any;

    const role = (req.user as any)?.role || '';
    const uid = getUserId(req);

    if (role === 'teacher') {
      // Always apply teacher edits directly (except delete handled elsewhere)
      const currentLesson = await LessonModel.findById(lid).lean();
      if (!currentLesson) return res.status(404).json({ message: 'Lesson not found' });

      const payload: any = {};
      if (title !== undefined) payload.title = title;
      if (video_url !== undefined) payload.video_url = video_url;
      if (duration_minutes !== undefined) payload.duration_minutes = Number(duration_minutes);
      if (position !== undefined) payload.position = Number(position);
      if (description !== undefined) payload.description = description;
      if (storage_provider !== undefined) payload.storage_provider = storage_provider;
      if (storage_bucket !== undefined) payload.storage_bucket = storage_bucket;
      if (storage_path !== undefined) payload.storage_path = storage_path;
      if (playback_url !== undefined) payload.playback_url = playback_url;

      const updated = await LessonModel.findByIdAndUpdate(lid, payload, { new: true, runValidators: true });
      if (!updated) return res.status(404).json({ message: 'Lesson not found' });
      try {
        const before: any = {}; const after: any = {};
        Object.keys(payload).forEach((k) => { before[k] = (currentLesson as any)?.[k]; after[k] = (payload as any)[k]; });
        const changed = buildChanges(before, after, Object.keys(after));
        if (Object.keys(changed).length > 0) {
          await EditHistory.create({ target_type: 'lesson', target_id: lid, submitted_by: new mongoose.Types.ObjectId(uid || undefined as any), submitted_role: 'teacher', status: 'applied', before, after, changes: changed });
        }
      } catch {}
      return res.json(updated);
    }

    // Admin: live update
    const payload: any = {};
    if (title !== undefined) payload.title = title;
    if (video_url !== undefined) payload.video_url = video_url;
    if (duration_minutes !== undefined) payload.duration_minutes = Number(duration_minutes);
    if (position !== undefined) payload.position = Number(position);
    if (description !== undefined) payload.description = description;
    if (storage_provider !== undefined) payload.storage_provider = storage_provider;
    if (storage_bucket !== undefined) payload.storage_bucket = storage_bucket;
    if (storage_path !== undefined) payload.storage_path = storage_path;
    if (playback_url !== undefined) payload.playback_url = playback_url;

    const current = await LessonModel.findById(lid).lean();
    const updated = await LessonModel.findByIdAndUpdate(lid, payload, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Lesson not found' });

    // History: admin applied edit
    try {
      const before: any = {};
      const after: any = {};
      Object.keys(payload).forEach((k) => {
        before[k] = (current as any)?.[k];
        after[k] = (payload as any)?.[k];
      });
      const changed = buildChanges(before, after, Object.keys(after));
      const uidStr = getUserId(req);
      if (Object.keys(changed).length > 0) {
        await EditHistory.create({
          target_type: "lesson",
          target_id: lid,
          submitted_by: uidStr ? new mongoose.Types.ObjectId(uidStr) : new mongoose.Types.ObjectId(),
          submitted_role: role === 'admin' ? 'admin' : 'system',
          status: "applied",
          before,
          after,
          changes: changed,
        });
      }
    } catch {}
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const approveLessonChanges = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId } = req.params as any;
    const lid = toObjectId(lessonId);
    if (!lid) return res.status(400).json({ message: 'Invalid lessonId' });
    const lesson: any = await LessonModel.findById(lid);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    const draft = lesson.draft || {};
    if (!lesson.has_pending_changes || !draft) return res.status(400).json({ message: 'No pending changes' });
    if ((draft as any).__action === 'delete') {
      const courseId = lesson.course_id;
      await LessonModel.deleteOne({ _id: lesson._id });
      await CourseModel.updateOne({ _id: courseId }, { $pull: { lessons: lesson._id } });
    } else {
      Object.assign(lesson, {
        title: draft.title !== undefined ? draft.title : lesson.title,
        description: draft.description !== undefined ? draft.description : lesson.description,
        video_url: draft.video_url !== undefined ? draft.video_url : lesson.video_url,
        playback_url: draft.playback_url !== undefined ? draft.playback_url : lesson.playback_url,
        storage_provider: draft.storage_provider !== undefined ? draft.storage_provider : lesson.storage_provider,
        storage_bucket: draft.storage_bucket !== undefined ? draft.storage_bucket : lesson.storage_bucket,
        storage_path: draft.storage_path !== undefined ? draft.storage_path : lesson.storage_path,
        draft: undefined,
        has_pending_changes: false,
        pending_by: null,
        pending_at: null,
      });
      await lesson.save();
    }
    // Mark latest pending history as approved
    try {
      const latest = await EditHistory.findOne({ target_type: 'lesson', target_id: lid, status: 'pending' }).sort({ created_at: -1 });
      if (latest) {
        latest.status = 'approved';
        latest.approved_by = getUserId(req) ? new mongoose.Types.ObjectId(String(getUserId(req))) : null;
        latest.approved_at = new Date();
        await latest.save();
      }
    } catch {}
    return res.json(lesson);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const rejectLessonChanges = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId } = req.params as any;
    const lid = toObjectId(lessonId);
    if (!lid) return res.status(400).json({ message: 'Invalid lessonId' });
    const updated = await LessonModel.findByIdAndUpdate(lid, { $unset: { draft: 1 }, $set: { has_pending_changes: false, pending_by: null, pending_at: null } }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Lesson not found' });
    // Mark latest pending history as rejected
    try {
      const latest = await EditHistory.findOne({ target_type: 'lesson', target_id: lid, status: 'pending' }).sort({ created_at: -1 });
      if (latest) {
        latest.status = 'rejected';
        latest.approved_by = getUserId(req) ? new mongoose.Types.ObjectId(String(getUserId(req))) : null;
        latest.approved_at = new Date();
        (latest as any).reason = (req.body as any)?.reason;
        await latest.save();
      }
    } catch {}
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const getPendingLessons = async (_req: Request, res: Response) => {
  try {
    const items = await LessonModel.find({ has_pending_changes: true })
      .select('title course_id pending_at draft')
      .lean();
    return res.json({ data: items, count: items.length });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server error' });
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

    // If teacher deletes lesson of a published course, create a pending delete instead
    const role = (req.user as any)?.role || '';
    const courseDoc = await CourseModel.findById((lesson as any).course_id).select('is_published').lean();
    if (role === 'teacher' && (courseDoc as any)?.is_published) {
      const updated = await LessonModel.findByIdAndUpdate(lid, {
        $set: {
          draft: { __action: 'delete' },
          has_pending_changes: true,
          pending_by: getUserId(req) ? new mongoose.Types.ObjectId(String(getUserId(req))) : null,
          pending_at: new Date(),
        },
      }, { new: true });
      try {
        await EditHistory.create({
          target_type: 'lesson',
          target_id: lid,
          submitted_by: new mongoose.Types.ObjectId(String(getUserId(req) || '000000000000000000000000')),
          submitted_role: 'teacher',
          status: 'pending',
          before: { deleted: false },
          after: { deleted: true },
          changes: { deleted: { from: false, to: true } },
        });
      } catch {}
      return res.json({ message: 'Delete request submitted', lesson: updated });
    }

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
    let rawPlayback = (lesson as any).playback_url || (lesson as any).video_url;

    // If Supabase storage used and no public URL, generate signed URL
    if (!rawPlayback && (lesson as any).storage_provider === 'supabase' && (lesson as any).storage_path) {
      try {
        const { supabaseAdmin } = await import('../lib/supabase');
        if (supabaseAdmin) {
          const bucket = (lesson as any).storage_bucket || 'videos';
          const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl((lesson as any).storage_path, 60 * 30);
          if (!error && data?.signedUrl) rawPlayback = data.signedUrl;
        }
      } catch {}
    }

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
  approveLessonChanges,
  rejectLessonChanges,
  getPendingLessons,
};

