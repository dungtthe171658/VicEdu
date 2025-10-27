import { Router } from "express";
import { authenticateToken } from "../middlewares/auth";
import { getMyEnrollments } from "../controllers/enrollment.controller";

const router = Router();

router.get("/my", authenticateToken, getMyEnrollments);

export default router;

