import express from "express";
import {
  createReview,
  getAllReviews,
  approveReview,
  deleteReview,
  getPublicReviews,
  getPublicSummary,
  countAllReviews,
} from "../controllers/review.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";

const router = express.Router();

// Public reviews (approved only)
router.get("/public", getPublicReviews);
router.get("/summary", getPublicSummary);

// Admin manage reviews
router.get("/", authenticateToken, checkRole(["admin"]), getAllReviews);
router.get("/count", authenticateToken, checkRole(["admin"]), countAllReviews);
router.patch("/:id/approve", authenticateToken, checkRole(["admin"]), approveReview);
router.delete("/:id", authenticateToken, checkRole(["admin"]), deleteReview);

// User creates review
router.post("/", authenticateToken, createReview);

export default router;
