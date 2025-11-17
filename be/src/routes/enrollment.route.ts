import { Router } from "express";
import { authenticateToken, checkRole } from "../middlewares/auth";
import { 
  getMyEnrollments, 
  getMyEnrollMini, 
  getEnrollmentByCourse, 
  completeLesson,
  getAllEnrollmentsForAdmin,
  getEnrollmentsByCoursesForTeacher
} from "../controllers/enrollment.controller";

const router = Router();

router.get("/my", authenticateToken, getMyEnrollments);
router.get("/my-mini", authenticateToken, getMyEnrollMini);
router.get("/course/:courseId", authenticateToken, getEnrollmentByCourse);
router.post("/complete-lesson", authenticateToken, completeLesson);

// Admin routes
router.get("/admin/all", authenticateToken, checkRole(["admin"]), getAllEnrollmentsForAdmin);

// Teacher routes
router.get("/teacher/by-courses", authenticateToken, checkRole(["teacher"]), getEnrollmentsByCoursesForTeacher);

export default router;
