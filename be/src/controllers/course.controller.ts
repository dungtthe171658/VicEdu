import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import CourseModel from "../models/course.model";
import slugify from "slugify";
import mongoose from "mongoose";

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
      .populate("teacher", "full_name avatar_url -_id")
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
    const { title, description, price, price_cents, category, category_id, thumbnail_url } = req.body as any;
    const teacher = req.user;
    const slug = slugify(title, { lower: true, strict: true });

    const newCourse = await CourseModel.create({
      title,
      slug,
      description,
      price: price !== undefined ? Number(price) : (price_cents !== undefined ? Number(price_cents) / 100 : 0),
      thumbnail_url,
      category: category ?? (category_id ? [category_id] : undefined),
      teacher,
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

    if (body.title !== undefined) {
      updates.title = body.title;
      // re-generate slug when title changes
      updates.slug = slugify(String(body.title), { lower: true, strict: true });
    }
    if (body.description !== undefined) updates.description = body.description;
    if (body.thumbnail_url !== undefined) updates.thumbnail_url = body.thumbnail_url;

    // price handling: accept either price (number) or price_cents (VND*100 pattern from FE)
    if (body.price !== undefined) updates.price = Number(body.price);
    if (body.price_cents !== undefined && (body.price === undefined)) {
      // Convert cents-like to basic unit
      updates.price = Number(body.price_cents) / 100;
    }

    if (body.category_id) {
      try {
        const cid = new mongoose.Types.ObjectId(String(body.category_id));
        updates.category = [cid];
      } catch {}
    }

    if (body.status !== undefined) {
      if (["pending", "approved", "rejected"].includes(String(body.status))) {
        updates.status = body.status;
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
