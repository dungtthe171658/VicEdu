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
router.get("/admin/pending", authenticateToken, checkRole(['admin']), courseController.getPendingCourses);
router.get("/teacher/all", authenticateToken, checkRole(['teacher']), courseController.getAllCoursesForTeacher);
router.patch("/:id/status", authenticateToken, checkRole(['admin']), courseController.updateCourseStatus);
router.put("/:id", authenticateToken, checkRole(['admin','teacher']), courseController.updateCourse);
router.delete("/:id", authenticateToken, checkRole(['admin']), courseController.deleteCourse);
router.post("/:id/approve-changes", authenticateToken, checkRole(['admin']), courseController.approveCourseChanges);
router.post("/:id/reject-changes", authenticateToken, checkRole(['admin']), courseController.rejectCourseChanges);
// Publish flow
router.post("/:id/request-publish", authenticateToken, checkRole(['teacher','admin']), courseController.requestPublish);
router.post("/:id/approve-publish", authenticateToken, checkRole(['admin']), courseController.approvePublish);
router.post("/:id/reject-publish", authenticateToken, checkRole(['admin']), courseController.rejectPublish);
// Delete request (teacher)
router.post("/:id/request-delete", authenticateToken, checkRole(['teacher','admin']), courseController.requestDeleteCourse);

// Nested routes
router.use("/:courseId/lessons", lessonRoutes);

export default router;
