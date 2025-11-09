import express from "express";
import { getAdminStats, getTeacherStats } from "../controllers/dashboard.controller";

import { authenticateToken, checkRole } from "../middlewares/auth";
const router = express.Router();
router.get("/admin", authenticateToken, checkRole(['admin']), getAdminStats);
router.get("/teacher", authenticateToken, checkRole(['teacher']), getTeacherStats);

export default router;
