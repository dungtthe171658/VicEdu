import { Request, Response } from "express";
import mongoose from "mongoose";
import EditHistory from "../models/editHistory.model";
import CourseModel from "../models/course.model";
import LessonModel from "../models/lesson.model";
import UserModel from "../models/user.model";

function toObjectId(id: any) {
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(String(id)) : null;
}

export const listByTarget = async (req: Request & { user?: any }, res: Response) => {
  try {
    const { type, id } = req.params as { type: string; id: string };
    const uid = (req.user && (req.user._id?.toString?.() || req.user.id?.toString?.())) || null;
    const role = String((req.user as any)?.role || "");

    const target_type = type === "course" ? "course" : type === "lesson" ? "lesson" : null;
    const oid = toObjectId(id);
    if (!target_type || !oid) return res.status(400).json({ message: "Invalid target" });

    // Authorization: admins can view all; teachers can view only if they own the target
    if (role !== "admin") {
      if (!uid) return res.status(401).json({ message: "Unauthenticated" });
      if (target_type === "course") {
        const course = await CourseModel.findById(oid).select("teacher").lean();
        const teacherIds = Array.isArray((course as any)?.teacher) ? (course as any).teacher.map((t: any) => String(t)) : [];
        if (!teacherIds.includes(String(uid))) return res.status(403).json({ message: "Forbidden" });
      } else {
        const lesson = await LessonModel.findById(oid).select("course_id").lean();
        if (!lesson) return res.status(404).json({ message: "Not found" });
        const course = await CourseModel.findById((lesson as any).course_id).select("teacher").lean();
        const teacherIds = Array.isArray((course as any)?.teacher) ? (course as any).teacher.map((t: any) => String(t)) : [];
        if (!teacherIds.includes(String(uid))) return res.status(403).json({ message: "Forbidden" });
      }
    }

    const items = await EditHistory.find({ target_type, target_id: oid }).sort({ created_at: -1 }).lean();
    return res.json({ data: items, count: items.length });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export default { listByTarget };

// Admin: list all pending edits across courses and lessons
export const listPendingAll = async (req: Request & { user?: any }, res: Response) => {
  try {
    const role = String((req.user as any)?.role || "");
    if (role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const items = await EditHistory.find({ status: 'pending' }).sort({ created_at: -1 }).lean();
    const withTitles = await Promise.all(
      items.map(async (it: any) => {
        let target_title: string | undefined;
        if (it.target_type === 'course') {
          const c = await CourseModel.findById(it.target_id).select('title').lean();
          target_title = (c as any)?.title;
        } else {
          const l = await LessonModel.findById(it.target_id).select('title course_id').lean();
          target_title = (l as any)?.title;
          (it as any).course_id = (l as any)?.course_id;
        }
        return { ...it, target_title };
      })
    );
    return res.json({ data: withTitles, count: withTitles.length });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Admin: list recent edits with optional status filter (only delete requests)
export const listRecentAll = async (req: Request & { user?: any }, res: Response) => {
  try {
    const role = String((req.user as any)?.role || "");
    if (role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { status, limit } = req.query as any;
    const q: any = {
      'changes.deleted': { $exists: true }, // Only delete requests
    };
    if (status) q.status = status;
    const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const items = await EditHistory.find(q).sort({ created_at: -1 }).limit(lim).lean();
    
    // Populate target information and user information
    const withDetails = await Promise.all(
      items.map(async (it: any) => {
        let target_title: string | undefined;
        let target_id_str = String(it.target_id);
        
        if (it.target_type === 'course') {
          const c = await CourseModel.findById(it.target_id).select('title').lean();
          target_title = (c as any)?.title;
        } else if (it.target_type === 'lesson') {
          const l = await LessonModel.findById(it.target_id).select('title course_id').lean();
          target_title = (l as any)?.title;
          (it as any).course_id = (l as any)?.course_id;
        }
        
        // Populate submitted_by user
        let submitted_by_name: string | undefined;
        if (it.submitted_by) {
          const user = await UserModel.findById(it.submitted_by).select('name email').lean();
          submitted_by_name = (user as any)?.name || (user as any)?.email || 'Unknown';
        }
        
        // Populate approved_by user if exists
        let approved_by_name: string | undefined;
        if (it.approved_by) {
          const approver = await UserModel.findById(it.approved_by).select('name email').lean();
          approved_by_name = (approver as any)?.name || (approver as any)?.email || 'Unknown';
        }
        
        return {
          ...it,
          target_title,
          submitted_by_name,
          approved_by_name,
        };
      })
    );
    
    return res.json({ data: withDetails, count: withDetails.length });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Teacher: list recent edits created by current user
export const listMyRecent = async (req: Request & { user?: any }, res: Response) => {
  try {
    const uid = (req.user && (req.user._id?.toString?.() || req.user.id?.toString?.())) || null;
    if (!uid) return res.status(401).json({ message: 'Unauthenticated' });
    const { status, limit } = req.query as any;
    const q: any = { submitted_by: new mongoose.Types.ObjectId(uid) };
    if (status) q.status = status;
    const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const items = await EditHistory.find(q).sort({ created_at: -1 }).limit(lim).lean();
    return res.json({ data: items, count: items.length });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};
