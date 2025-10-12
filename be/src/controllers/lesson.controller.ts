import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import LessonModel from "../models/lesson.model";
import CourseModel from "../models/course.model";

export const createLesson = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const { title, video_url, duration_minutes } = req.body;

    const course = await CourseModel.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Kiểm tra quyền sở hữu
    if (course.teacher_id.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: "You are not the owner of this course" });
    }

    const position = course.lessons.length;
    const newLesson = await LessonModel.create({ title, video_url, duration_minutes, course_id: courseId, position });

    course.lessons.push(newLesson._id);
    await course.save();

    res.status(201).json(newLesson);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
// ... (Thêm các hàm get, update, delete nếu cần)