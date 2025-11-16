import { Router } from "express";
import { authenticateToken } from "../middlewares/auth";
import { getMyEnrollments, getMyEnrollMini, getEnrollmentByCourse, completeLesson } from "../controllers/enrollment.controller";

const router = Router();

router.get("/my", authenticateToken, getMyEnrollments);
router.get("/my-mini", authenticateToken, getMyEnrollMini);
router.get("/course/:courseId", authenticateToken, getEnrollmentByCourse);
router.post("/complete-lesson", authenticateToken, completeLesson);

export default router;
