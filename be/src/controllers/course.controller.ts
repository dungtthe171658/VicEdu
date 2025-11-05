import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import CourseModel from "../models/course.model";
import slugify from "slugify";
import mongoose from "mongoose";
import UserModel from "../models/user.model";
import { SendEmail } from "../utils/send-email";
import { config } from "../config/config";
import LessonModel from "../models/lesson.model";

export const getPublicCourses = async (req: Request, res: Response) => {
  try {
    const courses = await CourseModel.find({ is_published: true })
      .populate("teacher", "name -_id")
      .populate("category", "name slug");
    res.status(200).json(courses);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCourseBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ message: "Thiếu tham số slug" });
    }

    const course = await CourseModel.findOne({ slug, is_published: true })
      .populate("teacher", "full_name avatar_url -_id") // lấy tên + avatar, bỏ _id
      .populate("category", "name slug")
      .lean();

    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Tạo thêm mảng teacherNames (nếu FE chỉ cần tên)
    const teacherNames = (course.teacher as any[]).map((t) => t.full_name);

    // Trả về dữ liệu kèm teacherNames
    return res.status(200).json({ ...course, teacherNames });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Lỗi server" });
  }
};

export const getCourseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Thiếu tham số id" });
    }

    const course = await CourseModel.findById(id)
      .populate("teacher", "full_name avatar_url")
      .populate("category", "name slug")
      .lean();

    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    const teacherNames = (course as any).teacher?.map((t: any) => t.full_name) || [];
    return res.status(200).json({ ...course, teacherNames });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Lỗi server" });
  }
};

export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, price, price_cents, category, category_id, thumbnail_url, teacher_ids } = req.body as any;
    const user: any = req.user || {};
    const slug = slugify(title, { lower: true, strict: true });

    // Determine teacher list
    let teachers: any[] = [];
    if (Array.isArray(teacher_ids) && teacher_ids.length > 0 && user?.role === 'admin') {
      teachers = teacher_ids
        .filter((id: any) => id)
        .map((id: any) => new mongoose.Types.ObjectId(String(id)));
    } else {
      const uid = user?._id?.toString?.() || user?.id?.toString?.();
      if (uid) teachers = [new mongoose.Types.ObjectId(uid)];
    }

    const newCourse = await CourseModel.create({
      title,
      slug,
      description,
      price: price !== undefined ? Number(price) : (price_cents !== undefined ? Number(price_cents) / 100 : 0),
      thumbnail_url,
      category: category ?? (category_id ? [category_id] : undefined),
      teacher: teachers,
    });
    res.status(201).json(newCourse);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllCoursesForAdmin = async (req: Request, res: Response) => {
  try {
    const courses = await CourseModel.find()
      .populate("teacher", "fullName")
      .sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// List courses of the authenticated teacher
export const getAllCoursesForTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const user: any = req.user || {};
    const uid = user?._id?.toString?.() || user?.id?.toString?.();
    if (!uid) return res.status(401).json({ message: "Unauthenticated" });

    const filter: any = { teacher: uid };
    if (req.query?.status) {
      filter.status = req.query.status;
    }

    const courses = await CourseModel.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(courses);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const updateCourseStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const course = await CourseModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.status(200).json(course);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Update a course (title, description, price/thumbnail/category/status)
export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const body = req.body || {};
    const updates: any = {};
    const user: any = req.user || {};
    const uid = user?._id?.toString?.() || user?.id?.toString?.();
    const role = String(user?.role || "");

    // Teachers must own the course to update
    if (role === 'teacher') {
      const found = await CourseModel.findById(id).select('teacher').lean();
      if (!found) return res.status(404).json({ message: 'Course not found' });
      const teachers = Array.isArray((found as any).teacher) ? (found as any).teacher : [];
      const owns = teachers.some((t: any) => String(t) === String(uid));
      if (!owns) return res.status(403).json({ message: 'You are not the owner of this course' });
      // Collect draft changes (content-only)
      const draft: any = {};
      if (body.title !== undefined) draft.title = String(body.title);
      if (body.description !== undefined) draft.description = String(body.description);
      if (body.thumbnail_url !== undefined) draft.thumbnail_url = String(body.thumbnail_url);
      if (body.category_id) draft.category_id = String(body.category_id);

      const updated = await CourseModel.findByIdAndUpdate(
        id,
        {
          $set: {
            draft,
            has_pending_changes: true,
            pending_by: uid ? new mongoose.Types.ObjectId(uid) : null,
            pending_at: new Date(),
          },
        },
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: 'Course not found' });

      // Notify admins by email (best-effort)
      try {
        const admins = await UserModel.find({ role: 'admin' }).select('email').lean();
        const emails = admins.map((a: any) => a.email).filter(Boolean);
        const link = `${config.frontend_url || ''}/dashboard/manage-courses/${id}`;
        await Promise.all(
          emails.map((to) =>
            SendEmail.sendBasicEmail({
              to,
              subject: `[VicEdu] Pending Course Changes: ${draft.title || 'Course #' + id}`,
              text: `A teacher submitted course edits. Review at ${link}.`,
            })
          )
        );
      } catch {}

      return res.json(updated);
    }

    // Admin flow (live updates allowed)
    if (body.title !== undefined) {
      updates.title = body.title;
      // re-generate slug when title changes
      updates.slug = slugify(String(body.title), { lower: true, strict: true });
    }
    if (body.description !== undefined) updates.description = body.description;
    if (body.thumbnail_url !== undefined) updates.thumbnail_url = body.thumbnail_url;

    // price handling (admin only)
    if (role === 'admin') {
      if (body.price !== undefined) updates.price = Number(body.price);
      if (body.price_cents !== undefined && (body.price === undefined)) {
        // Convert cents-like to basic unit
        updates.price = Number(body.price_cents) / 100;
      }
    }

    if (body.category_id) {
      try {
        const cid = new mongoose.Types.ObjectId(String(body.category_id));
        updates.category = [cid];
      } catch {}
    }

    // Admin-only: assign teachers
    try {
      if (role === 'admin') {
        if (Array.isArray(body.teacher_ids)) {
          updates.teacher = body.teacher_ids
            .filter((id: any) => id)
            .map((id: any) => new mongoose.Types.ObjectId(String(id)));
        } else if (body.teacher_id) {
          updates.teacher = [new mongoose.Types.ObjectId(String(body.teacher_id))];
        }
      }
    } catch {}

    // Admin-only: status & publish flag
    if (role === 'admin') {
      if (body.status !== undefined) {
        if (["pending", "approved", "rejected"].includes(String(body.status))) {
          updates.status = body.status;
        }
      }
      if (body.is_published !== undefined) {
        updates.is_published = Boolean(body.is_published);
      }
    }

    const updated = await CourseModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Course not found" });
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const approveCourseChanges = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const course: any = await CourseModel.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const draft = course.draft || {};
    if (!course.has_pending_changes || !draft) {
      return res.status(400).json({ message: 'No pending changes' });
    }
    if (draft.title !== undefined) course.title = draft.title;
    if (draft.description !== undefined) course.description = draft.description;
    if (draft.thumbnail_url !== undefined) course.thumbnail_url = draft.thumbnail_url;
    if (draft.category_id) {
      try { course.category = [new mongoose.Types.ObjectId(String(draft.category_id))]; } catch {}
    }
    course.draft = undefined;
    course.has_pending_changes = false;
    course.pending_by = null;
    course.pending_at = null;
    await course.save();
    return res.json(course);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const rejectCourseChanges = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const updated = await CourseModel.findByIdAndUpdate(
      id,
      { $unset: { draft: 1 }, $set: { has_pending_changes: false, pending_by: null, pending_at: null } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Course not found' });
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const getPendingCourses = async (_req: Request, res: Response) => {
  try {
    const items = await CourseModel.find({ has_pending_changes: true }).select('title pending_at').lean();
    return res.json({ data: items, count: items.length });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Admin: delete a course and its lessons
export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const course = await CourseModel.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Delete lessons of this course
    await LessonModel.deleteMany({ course_id: new mongoose.Types.ObjectId(id) });

    // Delete the course
    await CourseModel.deleteOne({ _id: id });

    return res.json({ message: "Course deleted" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};
