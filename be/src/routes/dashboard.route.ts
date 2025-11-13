import express from "express";
import { getAdminStats, getTeacherStats, getAdminActiveCourseCount, getAdminReviewCount } from "../controllers/dashboard.controller";

import { authenticateToken, checkRole } from "../middlewares/auth";
const router = express.Router();
router.get("/admin", authenticateToken, checkRole(['admin']), getAdminStats);
router.get("/admin/active-courses-count", authenticateToken, checkRole(['admin']), getAdminActiveCourseCount);
router.get("/admin/reviews-count", authenticateToken, checkRole(['admin']), getAdminReviewCount);
router.get("/teacher", authenticateToken, checkRole(['teacher']), getTeacherStats);

export default router;
