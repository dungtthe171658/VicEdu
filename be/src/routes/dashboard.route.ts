import express from "express";
import { getAdminStats } from "../controllers/dashboard.controller";

import { authenticateToken, checkRole } from "../middlewares/auth";
const router = express.Router();
router.get("/admin", authenticateToken, checkRole(['admin']), getAdminStats);

export default router;