// src/middlewares/canWatchLesson.ts
import { Request, Response, NextFunction } from "express";
import EnrollmentModel from "../models/enrollment.model";
import LessonModel from "../models/lesson.model";
import mongoose from "mongoose";

export const canWatchLesson = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.id || (req as any).user_id || (req as any).userId;
  const { lessonId } = req.params;
  if (!userId) return res.status(401).json({ message: "Unauthenticated" });

  const lesson = await LessonModel.findById(lessonId).lean();
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });
  if (lesson.status !== "ready") return res.status(409).json({ message: "Lesson not ready" });

  const enrolled = await EnrollmentModel.exists({
    user_id: new mongoose.Types.ObjectId(userId),
    course_id: new mongoose.Types.ObjectId(lesson.course_id),
  });
  if (!enrolled) return res.status(403).json({ message: "No access" });

  (req as any).lesson = lesson;
  next();
};
