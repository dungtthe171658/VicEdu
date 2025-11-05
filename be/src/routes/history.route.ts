import express from "express";
import { authenticateToken, checkRole } from "../middlewares/auth";
import { listByTarget, listPendingAll, listRecentAll, listMyRecent } from "../controllers/history.controller";

const router = express.Router();

// Allow both admin and teacher to view history; auth inside handler enforces ownership
router.get("/:type(course|lesson)/:id", authenticateToken, checkRole(["admin", "teacher"]), listByTarget);

// Aggregate lists
router.get("/admin/pending/all", authenticateToken, checkRole(["admin"]), listPendingAll);
router.get("/admin/recent", authenticateToken, checkRole(["admin"]), listRecentAll);
router.get("/my/recent", authenticateToken, checkRole(["teacher", "admin"]), listMyRecent);

export default router;
