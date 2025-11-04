import express from "express";
import * as courseController from "../controllers/course.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";
import lessonRoutes from "./lesson.route";

const router = express.Router();

router.get("/", courseController.getPublicCourses);
router.get("/id/:id", courseController.getCourseById);
router.get("/:slug", courseController.getCourseBySlug);

router.post("/", authenticateToken, checkRole(['admin', 'teacher']), courseController.createCourse);
router.get("/admin/all", authenticateToken, checkRole(['admin']), courseController.getAllCoursesForAdmin);
router.get("/teacher/all", authenticateToken, checkRole(['teacher']), courseController.getAllCoursesForTeacher);
router.patch("/:id/status", authenticateToken, checkRole(['admin']), courseController.updateCourseStatus);
router.put("/:id", authenticateToken, checkRole(['admin','teacher']), courseController.updateCourse);

// Nested routes
router.use("/:courseId/lessons", lessonRoutes);

export default router;
