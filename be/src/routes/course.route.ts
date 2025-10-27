import express from "express";
import * as courseController from "../controllers/course.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";
import lessonRoutes from "./lesson.route";

const router = express.Router();

router.get("/", courseController.getPublicCourses);
router.get("/:slug", courseController.getCourseBySlug);

router.post("/", authenticateToken, checkRole(['admin', 'teacher']), courseController.createCourse);
router.get("/admin/all", authenticateToken, checkRole(['admin']), courseController.getAllCoursesForAdmin);
router.patch("/:id/status", authenticateToken, checkRole(['admin']), courseController.updateCourseStatus);

// Nested routes
router.use("/:courseId/lessons", lessonRoutes);

export default router;