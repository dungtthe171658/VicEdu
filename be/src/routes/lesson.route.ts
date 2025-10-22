// src/routes/lesson.route.ts
import express from "express";
import {
  getLessonsOfCourse,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  getLessonPlayback,
} from "../controllers/lesson.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";

const router = express.Router({ mergeParams: true });

// 📌 Lấy danh sách lessons của course
router.get("/courses/:courseId/lessons", getLessonsOfCourse);

// 📌 Lấy chi tiết lesson
router.get("/:lessonId", getLessonById);

// 📌 Tạo lesson (chỉ teacher)
router.post(
  "/courses/:courseId/lessons",
  authenticateToken,
  checkRole(["teacher"]),
  createLesson
);

// 📌 Cập nhật lesson
router.put(
  "/:lessonId",
  authenticateToken,
  checkRole(["teacher"]),
  updateLesson
);

// 📌 Xoá lesson
router.delete(
  "/:lessonId",
  authenticateToken,
  checkRole(["teacher"]),
  deleteLesson
);

// 📌 Lấy playback URL (học viên đã enroll)
router.get("/:lessonId/playback", authenticateToken, getLessonPlayback);

export default router;
