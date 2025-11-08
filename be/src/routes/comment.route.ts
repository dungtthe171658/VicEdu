import express from "express";
import {
  listLessonComments,
  createLessonComment,
  listTeacherCommentThreads,
  updateCommentStatus,
} from "../controllers/comment.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";

const router = express.Router();

router.get("/lesson/:lessonId", listLessonComments);
router.post("/", authenticateToken, createLessonComment);
router.get(
  "/teacher",
  authenticateToken,
  checkRole(["teacher", "admin"]),
  listTeacherCommentThreads
);
router.patch(
  "/:commentId/status",
  authenticateToken,
  checkRole(["teacher", "admin"]),
  updateCommentStatus
);

export default router;

