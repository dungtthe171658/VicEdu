import express from "express";
import { createReview, approveReview } from "../controllers/review.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";

const router = express.Router();

router.post("/", authenticateToken, createReview);
router.patch("/:id/approve", authenticateToken, checkRole(['admin']), approveReview);

export default router;