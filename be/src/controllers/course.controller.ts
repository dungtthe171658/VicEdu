import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import CourseModel from "../models/course.model";
import slugify from "slugify";
import mongoose from "mongoose";
import UserModel from "../models/user.model";
import { SendEmail } from "../utils/send-email";
import { config } from "../config/config";
import LessonModel from "../models/lesson.model";
import EditHistory from "../models/editHistory.model";

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

export const getPublicCourses = async (req: Request, res: Response) => {
  try {
    const courses = await CourseModel.find({ 
      is_published: true
    })
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

    const course = await CourseModel.findOne({ 
      slug, 
      is_published: true
    })
      .populate("teacher", "full_name avatar -_id") // lấy tên + avatar, bỏ _id
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
      .populate("teacher", "full_name avatar")
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
    console.log('🔵 [createCourse] Request body:', JSON.stringify(req.body, null, 2));
    const { title, description, price, price_cents, category, category_id, thumbnail_url, teacher_ids } = req.body as any;
    const user: any = req.user || {};
    const role = String(user?.role || "");
    console.log('🔵 [createCourse] User role:', role, 'User ID:', user?._id || user?.id);
    console.log('🔵 [createCourse] Title:', title, 'Description:', description);
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
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

    // Teacher creates course directly (no approval needed)
    if (role === 'teacher') {
      const uid = user?._id?.toString?.() || user?.id?.toString?.();
      if (!uid) return res.status(401).json({ message: 'Unauthenticated' });

      console.log('🔵 [createCourse] Teacher - Creating course directly');

      // Validate category_id is provided
      if (!category_id) {
        return res.status(400).json({ message: 'Category is required' });
      }

      // Validate category_id is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(String(category_id))) {
        return res.status(400).json({ message: 'Invalid category ID format' });
      }

      // Validate description is provided
      if (!description) {
        return res.status(400).json({ message: 'Description is required' });
      }

      // Create course directly with approved status
      const courseData = {
        title,
        slug,
        description: description || '',
        price: price !== undefined ? Number(price) : (price_cents !== undefined ? Number(price_cents) / 100 : 0),
        thumbnail_url: thumbnail_url || '',
        category: [new mongoose.Types.ObjectId(String(category_id))],
        teacher: teachers,
        status: 'approved',
      };

      console.log('🔵 [createCourse] Teacher - Course data to create:', JSON.stringify({
        ...courseData,
        teacher: courseData.teacher.map((t: any) => t.toString()),
        category: courseData.category.map((c: any) => c.toString()),
      }, null, 2));

      const newCourse = await CourseModel.create(courseData);

      // Create EditHistory entry for tracking
      try {
        await EditHistory.create({
          target_type: 'course',
          target_id: new mongoose.Types.ObjectId(String(newCourse._id)),
          submitted_by: new mongoose.Types.ObjectId(uid),
          submitted_role: 'teacher',
          status: 'applied',
          before: {},
          after: {
            title,
            description: description || '',
            price: courseData.price,
            thumbnail_url: thumbnail_url || '',
            category_id: category_id,
          },
          changes: {
            title: { from: undefined, to: title },
            description: { from: undefined, to: description || '' },
            price: { from: undefined, to: courseData.price },
            thumbnail_url: { from: undefined, to: thumbnail_url || '' },
            category_id: { from: undefined, to: category_id },
          },
        });
      } catch (e) {
        console.error('Failed to create EditHistory:', e);
      }

      console.log('✅ [createCourse] Teacher - Course created successfully:', newCourse._id);
      return res.status(201).json(newCourse);
    }

    // Admin creates course directly (no approval needed)
    console.log('🔵 [createCourse] Admin - Creating course directly');
    if (!description) {
      return res.status(400).json({ message: 'Description is required for admin-created courses' });
    }
    
    // Validate category for admin
    let categoryArray: mongoose.Types.ObjectId[] = [];
    if (category_id) {
      if (!mongoose.Types.ObjectId.isValid(String(category_id))) {
        return res.status(400).json({ message: 'Invalid category ID format' });
      }
      categoryArray = [new mongoose.Types.ObjectId(String(category_id))];
    } else if (Array.isArray(category) && category.length > 0) {
      categoryArray = category
        .filter((c: any) => c && mongoose.Types.ObjectId.isValid(String(c)))
        .map((c: any) => new mongoose.Types.ObjectId(String(c)));
    }
    
    if (categoryArray.length === 0) {
      return res.status(400).json({ message: 'Category is required' });
    }
    
    const adminCourseData = {
      title,
      slug,
      description: description || '',
      price: price !== undefined ? Number(price) : (price_cents !== undefined ? Number(price_cents) / 100 : 0),
      thumbnail_url: thumbnail_url || '',
      category: categoryArray,
      teacher: teachers,
      status: 'approved',
    };
    
    console.log('🔵 [createCourse] Admin - Course data:', JSON.stringify({
      ...adminCourseData,
      teacher: adminCourseData.teacher.map((t: any) => t.toString()),
      category: Array.isArray(adminCourseData.category) ? adminCourseData.category.map((c: any) => c.toString()) : adminCourseData.category,
    }, null, 2));
    
    const newCourse = await CourseModel.create(adminCourseData);
    console.log('✅ [createCourse] Admin - Course created successfully:', newCourse._id);
    res.status(201).json(newCourse);
  } catch (error: any) {
    console.error('❌ [createCourse] Error:', error);
    console.error('❌ [createCourse] Error stack:', error.stack);
    console.error('❌ [createCourse] Error message:', error.message);
    if (error.errors) {
      console.error('❌ [createCourse] Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    res.status(500).json({ 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      validationErrors: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : undefined
    });
  }
};

export const getAllCoursesForAdmin = async (req: Request, res: Response) => {
  try {
    const courses = await CourseModel.find()
      .populate("teacher", "fullName")
      .populate("category", "name slug").lean()
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
      const found = await CourseModel.findById(id).lean();
      if (!found) return res.status(404).json({ message: 'Course not found' });
      const teachers = Array.isArray((found as any).teacher) ? (found as any).teacher : [];
      const owns = teachers.some((t: any) => String(t) === String(uid));
      if (!owns) return res.status(403).json({ message: 'You are not the owner of this course' });
      const coursePublished = !!(found as any).is_published;
      // Pre-publish: apply directly (minor/major all allowed)
      if (!coursePublished) {
        const direct: any = {};
        if (body.title !== undefined) direct.title = String(body.title);
        if (body.description !== undefined) direct.description = String(body.description);
        if (body.thumbnail_url !== undefined) direct.thumbnail_url = String(body.thumbnail_url);
        if (body.category_id) {
          try { direct.category = [new mongoose.Types.ObjectId(String(body.category_id))]; } catch {}
        }
        // auto update slug when title changes
        if (direct.title) direct.slug = slugify(String(direct.title), { lower: true, strict: true });
        // Allow teacher to toggle is_published (hide/show course)
        if (body.is_published !== undefined) {
          direct.is_published = Boolean(body.is_published);
        }
        // Allow teacher to edit price (both published and not published)
        if (body.price !== undefined) {
          direct.price = Number(body.price);
        } else if (body.price_cents !== undefined) {
          // Convert cents-like to basic unit
          direct.price = Number(body.price_cents) / 100;
        }
        const prev = await CourseModel.findById(id).lean();
        const updated = await CourseModel.findByIdAndUpdate(id, { $set: direct }, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ message: 'Course not found' });
        // history: applied
        try {
          const before: any = {}; const after: any = {};
          Object.keys(direct).forEach((k) => { before[k] = (prev as any)?.[k]; after[k] = (direct as any)[k]; });
          const changed = buildChanges(before, after, Object.keys(after));
          if (Object.keys(changed).length > 0) {
            await EditHistory.create({ target_type: 'course', target_id: new mongoose.Types.ObjectId(id), submitted_by: new mongoose.Types.ObjectId(uid!), submitted_role: 'teacher', status: 'applied', before, after, changes: changed });
          }
        } catch {}
        return res.json(updated);
      }

      // Post-publish: apply directly for non-pricing fields (no review)
      const setDirect: any = {};
      if (body.title !== undefined) setDirect.title = String(body.title);
      if (body.description !== undefined) setDirect.description = String(body.description);
      if (body.thumbnail_url !== undefined) setDirect.thumbnail_url = String(body.thumbnail_url);
      if (body.category_id) {
        try { setDirect.category = [new mongoose.Types.ObjectId(String(body.category_id))]; } catch {}
      }
      if (setDirect.title) setDirect.slug = slugify(String(setDirect.title), { lower: true, strict: true });
      // Allow teacher to toggle is_published (hide/show course)
      if (body.is_published !== undefined) {
        setDirect.is_published = Boolean(body.is_published);
      }
      // Allow teacher to edit price (both published and not published)
      if (body.price !== undefined) {
        setDirect.price = Number(body.price);
      } else if (body.price_cents !== undefined) {
        // Convert cents-like to basic unit
        setDirect.price = Number(body.price_cents) / 100;
      }

      const prevDoc = await CourseModel.findById(id).lean();
      const updatedDoc = await CourseModel.findByIdAndUpdate(id, { $set: setDirect }, { new: true, runValidators: true });
      if (!updatedDoc) return res.status(404).json({ message: 'Course not found' });

      // log as applied
      try {
        const before: any = {}; const after: any = {};
        Object.keys(setDirect).forEach((k) => {
          if (k === 'category') {
            before['category_id'] = Array.isArray((prevDoc as any)?.category) && (prevDoc as any)?.category.length > 0 ? String((prevDoc as any).category[0]) : undefined;
            after['category_id'] = Array.isArray((setDirect as any)?.category) && (setDirect as any)?.category.length > 0 ? String((setDirect as any).category[0]) : before['category_id'];
          } else {
            before[k] = (prevDoc as any)?.[k];
            after[k] = (setDirect as any)?.[k];
          }
        });
        const changed = buildChanges(before, after, Object.keys(after));
        if (Object.keys(changed).length > 0) {
          await EditHistory.create({ target_type: 'course', target_id: new mongoose.Types.ObjectId(id), submitted_by: new mongoose.Types.ObjectId(uid!), submitted_role: 'teacher', status: 'applied', before, after, changes: changed });
        }
      } catch {}

      return res.json(updatedDoc);
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

    // Fetch current to log history
    const current = await CourseModel.findById(id).lean();
    const updated = await CourseModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Course not found" });

    // History: admin applied edit immediately
    try {
      const uidObj = uid ? new mongoose.Types.ObjectId(uid) : new mongoose.Types.ObjectId();
      const before: any = {};
      const after: any = {};
      const keys = Object.keys(updates);
      keys.forEach((k) => {
        if (k === "teacher") return; // skip heavy arrays unless necessary
        if (k === "category") {
          before["category_id"] = Array.isArray((current as any)?.category) && (current as any)?.category.length > 0 ? String((current as any).category[0]) : undefined;
          after["category_id"] = Array.isArray((updates as any)?.category) && (updates as any)?.category.length > 0 ? String((updates as any).category[0]) : before["category_id"];
        } else {
          before[k] = (current as any)?.[k];
          after[k] = (updates as any)?.[k];
        }
      });
      const changed = buildChanges(before, after, Object.keys(after));
      if (Object.keys(changed).length > 0) {
        await EditHistory.create({
          target_type: "course",
          target_id: new mongoose.Types.ObjectId(id),
          submitted_by: uidObj,
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

export const approveCourseChanges = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const course: any = await CourseModel.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const draft = course.draft || {};
    if (!course.has_pending_changes || !draft) {
      return res.status(400).json({ message: 'No pending changes' });
    }
    if ((draft as any).__action === 'delete') {
      // Delete course and its lessons
      await LessonModel.deleteMany({ course_id: new mongoose.Types.ObjectId(id) });
      await CourseModel.deleteOne({ _id: id });
    } else if ((draft as any).__action === 'create') {
      // Approve course creation request
      if (draft.title !== undefined) course.title = draft.title;
      if (draft.description !== undefined) course.description = draft.description;
      if (draft.thumbnail_url !== undefined) course.thumbnail_url = draft.thumbnail_url;
      if (draft.price !== undefined) course.price = Number(draft.price);
      if (draft.category_id) {
        try { course.category = [new mongoose.Types.ObjectId(String(draft.category_id))]; } catch {}
      }
      // Update slug when title changes
      if (draft.title) {
        course.slug = slugify(String(draft.title), { lower: true, strict: true });
      }
      course.status = 'approved';
      course.draft = undefined;
      course.has_pending_changes = false;
      course.pending_by = null;
      course.pending_at = null;
      await course.save();
    } else {
      // Regular edit approval
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
    }

    // Mark latest pending history as approved
    try {
      const latest = await EditHistory.findOne({ target_type: 'course', target_id: new mongoose.Types.ObjectId(id), status: 'pending' })
        .sort({ created_at: -1 });
      if (latest) {
        latest.status = 'approved';
        latest.approved_by = (req as any)?.user?._id ? new mongoose.Types.ObjectId(String((req as any).user._id)) : null;
        latest.approved_at = new Date();
        await latest.save();
      }
    } catch {}
    return res.json(course);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const rejectCourseChanges = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const course: any = await CourseModel.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const draft = course.draft || {};
    
    // If it's a creation request, delete the course when rejected
    if ((draft as any).__action === 'create') {
      await LessonModel.deleteMany({ course_id: new mongoose.Types.ObjectId(id) });
      await CourseModel.deleteOne({ _id: id });
      
      // Mark latest pending history as rejected
      try {
        const latest = await EditHistory.findOne({ target_type: 'course', target_id: new mongoose.Types.ObjectId(id), status: 'pending' })
          .sort({ created_at: -1 });
        if (latest) {
          latest.status = 'rejected';
          latest.approved_by = (req as any)?.user?._id ? new mongoose.Types.ObjectId(String((req as any).user._id)) : null;
          latest.approved_at = new Date();
          latest.reason = (req.body as any)?.reason;
          await latest.save();
        }
      } catch {}
      return res.json({ message: 'Course creation request rejected and course deleted', deleted: true });
    }
    
    // For regular edits, just clear the draft
    const updated = await CourseModel.findByIdAndUpdate(
      id,
      { $unset: { draft: 1 }, $set: { has_pending_changes: false, pending_by: null, pending_at: null } },
      { new: true }
    );
    
    // Mark latest pending history as rejected
    try {
      const latest = await EditHistory.findOne({ target_type: 'course', target_id: new mongoose.Types.ObjectId(id), status: 'pending' })
        .sort({ created_at: -1 });
      if (latest) {
        latest.status = 'rejected';
        latest.approved_by = (req as any)?.user?._id ? new mongoose.Types.ObjectId(String((req as any).user._id)) : null;
        latest.approved_at = new Date();
        latest.reason = (req.body as any)?.reason;
        await latest.save();
      }
    } catch {}
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Teacher: request delete course (creates pending)
export const requestDeleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as any;
    const user: any = req.user || {};
    const uid = user?._id?.toString?.() || user?.id?.toString?.();
    if (!uid) return res.status(401).json({ message: 'Unauthenticated' });
    const course: any = await CourseModel.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const owns = (Array.isArray(course.teacher) ? course.teacher : []).some((t: any) => String(t) === String(uid));
    if (!owns && user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    // Check if there's already a pending delete request for this course
    const existingPending = await EditHistory.findOne({
      target_type: 'course',
      target_id: new mongoose.Types.ObjectId(id),
      status: 'pending',
      'changes.deleted': { $exists: true },
    }).lean();

    if (existingPending) {
      return res.status(400).json({ 
        message: 'Đã có yêu cầu xóa đang chờ phê duyệt cho khóa học này. Vui lòng chờ admin xử lý.' 
      });
    }

    // Check if course already has pending delete request
    if ((course as any).has_pending_changes && (course as any).draft?.__action === 'delete') {
      return res.status(400).json({ 
        message: 'Đã có yêu cầu xóa đang chờ phê duyệt cho khóa học này. Vui lòng chờ admin xử lý.' 
      });
    }

    const updated = await CourseModel.findByIdAndUpdate(id, {
      $set: {
        draft: { __action: 'delete' },
        has_pending_changes: true,
        pending_by: new mongoose.Types.ObjectId(uid),
        pending_at: new Date(),
      },
    }, { new: true });

    try {
      await EditHistory.create({
        target_type: 'course',
        target_id: new mongoose.Types.ObjectId(id),
        submitted_by: new mongoose.Types.ObjectId(uid),
        submitted_role: 'teacher',
        status: 'pending',
        before: { deleted: false },
        after: { deleted: true },
        changes: { deleted: { from: false, to: true } },
      });
    } catch {}

    return res.json({ message: 'Delete request submitted', course: updated });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const getPendingCourses = async (_req: Request, res: Response) => {
  try {
    const items = await CourseModel.find({ has_pending_changes: true })
      .select('title pending_at draft')
      .lean();
    return res.json({ data: items, count: items.length });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Teacher: request publish (first approval)
export const requestPublish = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as any;
    const user: any = req.user || {};
    const uid = user?._id?.toString?.() || user?.id?.toString?.();
    if (!uid) return res.status(401).json({ message: 'Unauthenticated' });
    const course: any = await CourseModel.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.is_published) return res.status(400).json({ message: 'Already published' });
    const owns = (Array.isArray(course.teacher) ? course.teacher : []).some((t: any) => String(t) === String(uid));
    if (!owns && user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    course.publish_requested_at = new Date();
    course.publish_requested_by = new mongoose.Types.ObjectId(uid);
    course.status = 'pending';
    await course.save();
    try {
      const admins = await UserModel.find({ role: 'admin' }).select('email').lean();
      const emails = admins.map((a: any) => a.email).filter(Boolean);
      const link = `${config.frontend_url || ''}/dashboard/manage-courses/${id}`;
      await Promise.all(emails.map((to) => SendEmail.sendBasicEmail({ to, subject: `[VicEdu] Publish request: ${course.title}`, text: `Review course to publish: ${link}` })));
    } catch {}
    return res.json({ message: 'Publish request submitted', course });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const approvePublish = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as any;
    const updated = await CourseModel.findByIdAndUpdate(id, { $set: { is_published: true, published_at: new Date(), status: 'approved' }, $unset: { publish_requested_at: 1, publish_requested_by: 1 } }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Course not found' });
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const rejectPublish = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as any;
    const updated = await CourseModel.findByIdAndUpdate(id, { $set: { status: 'rejected' }, $unset: { publish_requested_at: 1, publish_requested_by: 1 } }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Course not found' });
    return res.json(updated);
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

// Count all courses
export const countAllCourses = async (_req: AuthRequest, res: Response) => {
  try {
    const count = await CourseModel.countDocuments();
    return res.status(200).json({ count });
  } catch (error: any) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};