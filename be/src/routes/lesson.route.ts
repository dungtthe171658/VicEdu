// src/routes/lesson.route.ts
import express from "express";
import {
  getLessonsOfCourse,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  getLessonPlayback,
  approveLessonChanges,
  rejectLessonChanges,
  getPendingLessons,
  requestDeleteLesson,
} from "../controllers/lesson.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";

const router = express.Router({ mergeParams: true });

// Admin: list pending lesson edits (define before dynamic routes)
router.get("/pending", authenticateToken, checkRole(["admin"]), getPendingLessons);

// 📌 Lấy danh sách lessons của course
router.get("/courses/:courseId/lessons", getLessonsOfCourse);

// 📌 Lấy chi tiết lesson
router.get("/:lessonId", getLessonById);

// 📌 Tạo lesson (chỉ teacher)
router.post(
  "/courses/:courseId/lessons",
  authenticateToken,
  checkRole(["teacher", "admin"]),
  createLesson
);

// 📌 Cập nhật lesson
router.put(
  "/:lessonId",
  authenticateToken,
  checkRole(["teacher", "admin"]),
  updateLesson
);

// 📌 Xoá lesson
router.delete(
  "/:lessonId",
  authenticateToken,
  checkRole(["teacher", "admin"]),
  deleteLesson
);

// 📌 Lấy playback URL (học viên đã enroll)
router.get("/:lessonId/playback", authenticateToken, getLessonPlayback);

// Admin approve/reject lesson edits
router.post(
  "/:lessonId/approve-changes",
  authenticateToken,
  checkRole(["admin"]),
  approveLessonChanges
);
router.post(
  "/:lessonId/reject-changes",
  authenticateToken,
  checkRole(["admin"]),
  rejectLessonChanges
);

// Teacher: request delete lesson (creates pending delete request)
router.post(
  "/:lessonId/request-delete",
  authenticateToken,
  checkRole(["teacher", "admin"]),
  requestDeleteLesson
);

export default router;
