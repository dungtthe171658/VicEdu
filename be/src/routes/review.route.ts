import express from "express";
import {
  createReview,
  getAllReviews,
  approveReview,
  deleteReview,
} from "../controllers/review.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";

const router = express.Router();

// Public reviews (không cần token)
router.get("/public", getAllReviews);

// Admin quản lý reviews (cần token admin)
router.get("/", authenticateToken, checkRole(["admin"]), getAllReviews);
router.patch("/:id/approve", authenticateToken, checkRole(["admin"]), approveReview);
router.delete("/:id", authenticateToken, checkRole(["admin"]), deleteReview);

// User đã login tạo review
router.post("/", authenticateToken, createReview);

export default router;
