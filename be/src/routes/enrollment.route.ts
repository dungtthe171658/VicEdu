import { Router } from "express";
import { authenticateToken } from "../middlewares/auth";
import { getMyEnrollments, getMyEnrollMini } from "../controllers/enrollment.controller";

const router = Router();

router.get("/my", authenticateToken, getMyEnrollments);
router.get("/my-mini", authenticateToken, getMyEnrollMini);

export default router;
