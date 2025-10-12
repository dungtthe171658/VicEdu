import express from "express";
import { createLesson } from "../controllers/lesson.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";

const router = express.Router({ mergeParams: true });

router.post("/", authenticateToken, checkRole(['teacher']), createLesson);

export default router;